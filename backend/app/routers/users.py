from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..models.models import User, FamilyGroup
from ..schemas.schemas import UserCreate, UserOut, UserUpdate
from ..services.subscriptions import effective_plan, get_plan_limits, get_subscription
from typing import List
from datetime import datetime
from sqlalchemy import select, func
from .auth import get_current_user, get_password_hash
import secrets

router = APIRouter()


@router.post("/", response_model=UserOut)
def create_user(
    payload: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new user (family member). Requires authentication and family membership."""
    # Validate password requirement based on role
    if payload.role == "parent":
        if not payload.password:
            raise HTTPException(
                status_code=400, detail="Password is required for parents"
            )
        if not payload.email:
            raise HTTPException(status_code=400, detail="Email is required for parents")

    # Check if email already exists (only if provided)
    if payload.email:
        existing = db.execute(
            select(User).where(User.email == payload.email)
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

    # User must belong to a family to add members
    if not current_user.family_id:
        raise HTTPException(
            status_code=400, detail="You must belong to a family to add members"
        )

    # Validate family_id matches current user's family
    if payload.family_id is not None and payload.family_id != current_user.family_id:
        raise HTTPException(
            status_code=403, detail="Cannot add members to a different family"
        )

    # Use current user's family if not specified
    family_id = payload.family_id or current_user.family_id
    family = db.get(FamilyGroup, family_id)
    if not family:
        raise HTTPException(
            status_code=404, detail=f"Family with id {family_id} not found"
        )

    # Enforce plan limits for child accounts
    if payload.role == "child":
        subscription = get_subscription(db, current_user.id)
        plan = effective_plan(subscription)
        limits = get_plan_limits(plan)
        max_children = limits.get("max_children")

        if max_children is not None:
            child_count = (
                db.execute(
                    select(func.count()).where(
                        User.family_id == family_id, User.role == "child"
                    )
                )
                .scalar_one()
            )
            if child_count >= max_children:
                raise HTTPException(
                    status_code=403,
                    detail="Child limit reached for this plan. Upgrade to add more children.",
                )

    # For children, use a placeholder password hash (they can't log in)
    # For parents, use the provided password
    if payload.role == "child":
        # Generate a random password hash that will never be used for login
        # This satisfies the database constraint but ensures children can't authenticate
        placeholder_password = secrets.token_urlsafe(32)
        password_hash = get_password_hash(placeholder_password)
    else:
        password_hash = get_password_hash(payload.password)

    user = User(
        family_id=family_id,
        name=payload.name,
        email=payload.email,  # Can be None for children
        password_hash=password_hash,
        role=payload.role,
        profile_image_url=None,
        icon_emoji=None,
        created_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a user by ID. Requires authentication and same family membership."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user belongs to the same family or is viewing themselves
    if user.family_id != current_user.family_id and user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return user


@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a user. Users can only update themselves or family members."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user belongs to the same family or is updating themselves
    if user.family_id != current_user.family_id and user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a user. Requires authentication and same family membership."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user belongs to the same family
    if user.family_id != current_user.family_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Prevent deleting yourself
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    db.delete(user)
    db.commit()
    return {"message": "deleted"}


@router.get("/", response_model=List[UserOut])
def list_users(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """List users in the current user's family. Requires authentication."""
    if not current_user.family_id:
        return []
    rows = (
        db.execute(select(User).where(User.family_id == current_user.family_id))
        .scalars()
        .all()
    )
    return rows
