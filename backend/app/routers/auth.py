import logging
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import select, and_
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import bcrypt

from ..config import settings
from ..db.session import get_db
from ..models.models import User, FamilyGroup, PasswordResetToken, QRCodeSession
from ..services.subscriptions import upsert_subscription
from ..schemas.schemas import (
    Token,
    LoginRequest,
    AdminLoginRequest,
    SignupRequest,
    UserOut,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    Message,
    QRCodeSessionResponse,
    QRCodeScanRequest,
    QRCodeStatusResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer()


# Password hashing - use bcrypt directly to avoid passlib initialization issues
def _truncate_password(password: str) -> bytes:
    """Truncate password to 72 bytes (bcrypt limit)."""
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > 72:
        return password_bytes[:72]
    return password_bytes


# JWT settings from centralized configuration
SECRET_KEY = settings.secret_key
ALGORITHM = settings.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    try:
        plain_bytes = _truncate_password(plain_password)
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    password_bytes = _truncate_password(password)
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    # JWT exp field must be a Unix timestamp (integer), not a datetime object
    to_encode.update({"exp": int(expire.timestamp())})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        logger.warning(f"JWT decode error: {e}")
        return None
    except Exception as e:
        logger.error(f"Token decode error: {e}", exc_info=True)
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Get the current authenticated user from the token."""
    token = credentials.credentials
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str: Optional[str] = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Convert string user_id back to integer
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


@router.post("/signup", response_model=Token)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    """Create a new user account."""
    # Check if email already exists
    existing = db.execute(
        select(User).where(User.email == payload.email)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    # Create new user
    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        role=payload.role,
        family_id=None,  # User can join/create family later
        created_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Seed a subscription row for this user (defaults to free)
    upsert_subscription(
        db=db,
        user=user,
        price_id=None,
        stripe_subscription_id=None,
        stripe_customer_id=None,
        status="inactive",
        current_period_end=None,
        cancel_at_period_end=False,
    )

    # Generate token
    access_token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=access_token)


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password."""
    user = db.execute(
        select(User).where(User.email == payload.email)
    ).scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    # Verify password
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    # Generate token
    access_token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=access_token)


@router.get("/me", response_model=UserOut)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user information."""
    return current_user


@router.post("/admin-login", response_model=Token)
def admin_login(payload: AdminLoginRequest, db: Session = Depends(get_db)):
    """Admin login for family management."""
    fam = db.get(FamilyGroup, payload.family_id)
    if not fam:
        raise HTTPException(status_code=404, detail="Family not found")

    # Verify admin password
    if not verify_password(payload.admin_password, fam.admin_password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin credentials"
        )

    # Generate token with family admin subject
    access_token = create_access_token(data={"sub": f"family-admin:{fam.id}"})
    return Token(access_token=access_token)


@router.post("/forgot-password", response_model=Message)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Request a password reset token for the given email."""
    user = db.execute(
        select(User).where(User.email == payload.email)
    ).scalar_one_or_none()

    # Always return success message to prevent email enumeration
    # In production, this would send an email with the reset link
    if user:
        # Generate a secure token
        token = secrets.token_urlsafe(32)

        # Create reset token (expires in 1 hour)
        reset_token = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(hours=1),
            used=False,
        )
        db.add(reset_token)
        db.commit()

        # In development, return the token in the response
        # In production, this would be sent via email
        logger.info(f"Password reset token generated for user {user.id}: {token}")

    return Message(
        message="If an account with that email exists, a password reset link has been sent."
    )


@router.post("/reset-password", response_model=Message)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using a valid reset token."""
    # Find the reset token
    reset_token = db.execute(
        select(PasswordResetToken).where(
            and_(
                PasswordResetToken.token == payload.token,
                ~PasswordResetToken.used,
                PasswordResetToken.expires_at > datetime.utcnow(),
            )
        )
    ).scalar_one_or_none()

    if not reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    # Get the user
    user = db.get(User, reset_token.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Update password
    user.password_hash = get_password_hash(payload.new_password)

    # Mark token as used
    reset_token.used = True

    # Invalidate any other unused tokens for this user
    other_tokens = (
        db.execute(
            select(PasswordResetToken).where(
                and_(
                    PasswordResetToken.user_id == user.id,
                    ~PasswordResetToken.used,
                    PasswordResetToken.id != reset_token.id,
                )
            )
        )
        .scalars()
        .all()
    )
    for token in other_tokens:
        token.used = True

    db.commit()

    return Message(message="Password has been reset successfully")


@router.post("/qr-code/generate", response_model=QRCodeSessionResponse)
def generate_qr_code_session(db: Session = Depends(get_db)):
    """Generate a new QR code session for login."""
    # Generate a secure session token
    session_token = secrets.token_urlsafe(32)

    # Create session (expires in 5 minutes)
    qr_session = QRCodeSession(
        session_token=session_token,
        expires_at=datetime.utcnow() + timedelta(minutes=5),
        scanned=False,
    )
    db.add(qr_session)
    db.commit()
    db.refresh(qr_session)

    # Construct QR code URL (deep link format for mobile app)
    # Format: famloop://login?token=<session_token>
    qr_code_url = f"famloop://login?token={session_token}"

    return QRCodeSessionResponse(
        session_token=session_token,
        expires_at=qr_session.expires_at,
        qr_code_url=qr_code_url,
    )


@router.post("/qr-code/scan", response_model=Message)
def scan_qr_code(payload: QRCodeScanRequest, db: Session = Depends(get_db)):
    """Scan QR code and associate with user (called from mobile app)."""
    # Find the session
    qr_session = db.execute(
        select(QRCodeSession).where(
            and_(
                QRCodeSession.session_token == payload.session_token,
                ~QRCodeSession.scanned,
                QRCodeSession.expires_at > datetime.utcnow(),
            )
        )
    ).scalar_one_or_none()

    if not qr_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired QR code session",
        )

    # Verify user exists
    user = db.get(User, payload.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Mark session as scanned
    qr_session.scanned = True
    qr_session.scanned_at = datetime.utcnow()
    qr_session.user_id = payload.user_id

    db.commit()

    return Message(message="QR code scanned successfully")


@router.get("/qr-code/status/{session_token}", response_model=QRCodeStatusResponse)
def check_qr_code_status(session_token: str, db: Session = Depends(get_db)):
    """Check the status of a QR code session (polling endpoint)."""
    qr_session = db.execute(
        select(QRCodeSession).where(QRCodeSession.session_token == session_token)
    ).scalar_one_or_none()

    if not qr_session:
        return QRCodeStatusResponse(status="expired")

    # Check if expired
    if qr_session.expires_at < datetime.utcnow():
        return QRCodeStatusResponse(status="expired")

    # Check if scanned
    if qr_session.scanned and qr_session.user_id:
        # Generate auth token for the user
        access_token = create_access_token(data={"sub": str(qr_session.user_id)})
        return QRCodeStatusResponse(status="scanned", access_token=access_token)

    return QRCodeStatusResponse(status="pending")
