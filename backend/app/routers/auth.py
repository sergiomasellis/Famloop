import logging
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import select, and_
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import bcrypt
import httpx
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from urllib.parse import urlencode, urlparse, urlunparse, parse_qsl

from ..config import settings
from ..db.session import get_db
from ..models.models import User, FamilyGroup, PasswordResetToken
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


def _build_google_redirect_uri() -> str:
    """Resolve the redirect URI used for Google OAuth callbacks."""
    return settings.google_redirect_uri or "http://localhost:8000/api/auth/google/callback"


def _default_return_url() -> str:
    """Return default frontend callback URL for OAuth completion."""
    return settings.default_frontend_origin.rstrip("/") + "/auth/social/callback"


def _sanitize_return_url(return_url: Optional[str]) -> str:
    """Allow return URLs only on configured frontend origins."""
    if not return_url:
        return _default_return_url()
    try:
        parsed = urlparse(return_url)
        candidate_origin = f"{parsed.scheme}://{parsed.netloc}"
    except Exception:
        return _default_return_url()

    for origin in settings.cors_origins_list:
        if candidate_origin == origin.rstrip("/"):
            return return_url

    if settings.frontend_app_url and candidate_origin == settings.frontend_app_url.rstrip("/"):
        return return_url

    logger.warning("Invalid return_url provided; using default")
    return _default_return_url()


def _append_query(url: str, params: dict[str, str]) -> str:
    """Append query parameters to a URL safely."""
    parsed = urlparse(url)
    query = dict(parse_qsl(parsed.query))
    query.update(params)
    new_query = urlencode(query)
    return urlunparse(parsed._replace(query=new_query))


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


@router.get("/google/login")
async def google_login(return_url: Optional[str] = None):
    """Begin Google OAuth login/signup."""
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured",
        )

    sanitized_return_url = _sanitize_return_url(return_url)
    state_token = create_access_token(
        data={"sub": "google_oauth_state", "return_url": sanitized_return_url},
        expires_delta=timedelta(minutes=10),
    )

    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": _build_google_redirect_uri(),
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
        "state": state_token,
    }
    auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return RedirectResponse(auth_url)


@router.get("/google/callback")
async def google_callback(code: str, state: str, db: Session = Depends(get_db)):
    """Handle Google OAuth callback, issue access token, and redirect to frontend."""
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured",
        )

    payload = decode_token(state)
    if not payload or payload.get("sub") != "google_oauth_state":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid state token"
        )

    return_url = _sanitize_return_url(payload.get("return_url"))

    token_payload = {
        "code": code,
        "client_id": settings.google_client_id,
        "client_secret": settings.google_client_secret,
        "redirect_uri": _build_google_redirect_uri(),
        "grant_type": "authorization_code",
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data=token_payload,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
    except Exception as exc:
        logger.error("Google token exchange failed", exc_info=True)
        return RedirectResponse(
            _append_query(return_url, {"error": "google_token_exchange_failed"}),
            status_code=status.HTTP_302_FOUND,
        )

    if token_resp.status_code != 200:
        logger.warning(
            "Google token exchange returned non-200",
            extra={"status": token_resp.status_code, "body": token_resp.text},
        )
        return RedirectResponse(
            _append_query(return_url, {"error": "google_token_exchange_failed"}),
            status_code=status.HTTP_302_FOUND,
        )

    token_data = token_resp.json()
    id_token_value = token_data.get("id_token")
    if not id_token_value:
        return RedirectResponse(
            _append_query(return_url, {"error": "google_missing_id_token"}),
            status_code=status.HTTP_302_FOUND,
        )

    try:
        id_info = google_id_token.verify_oauth2_token(
            id_token_value, google_requests.Request(), settings.google_client_id
        )
    except Exception:
        logger.warning("Google ID token verification failed", exc_info=True)
        return RedirectResponse(
            _append_query(return_url, {"error": "google_invalid_token"}),
            status_code=status.HTTP_302_FOUND,
        )

    email = id_info.get("email")
    if not email:
        return RedirectResponse(
            _append_query(return_url, {"error": "google_email_missing"}),
            status_code=status.HTTP_302_FOUND,
        )

    name = id_info.get("name") or email.split("@")[0]
    picture = id_info.get("picture")
    email_verified = id_info.get("email_verified", False)

    user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    created = False

    if not user:
        placeholder_password = get_password_hash(secrets.token_urlsafe(32))
        user = User(
            name=name,
            email=email,
            password_hash=placeholder_password,
            role="parent",
            family_id=None,
            profile_image_url=picture,
            created_at=datetime.utcnow(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        created = True

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
    else:
        updated = False
        if picture and not user.profile_image_url:
            user.profile_image_url = picture
            updated = True
        if name and not user.name:
            user.name = name
            updated = True
        if updated:
            db.commit()
            db.refresh(user)

    access_token = create_access_token(data={"sub": str(user.id)})

    # Redirect back to frontend with token (and optional created flag)
    params = {"token": access_token}
    if created:
        params["created"] = "1"
    if not email_verified:
        params["email_unverified"] = "1"

    return RedirectResponse(
        _append_query(return_url, params),
        status_code=status.HTTP_302_FOUND,
    )


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


