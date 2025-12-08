from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from ..db.session import get_db
from ..models.models import FamilyGroup, User
from ..schemas.schemas import FamilyCreate, FamilyOut, FamilyInvite, FamilyUpdate
from ..services.subscriptions import get_plan_limits, get_subscription, effective_plan
from .auth import get_current_user, get_password_hash

router = APIRouter()


@router.post("/", response_model=FamilyOut)
def create_family(
    payload: FamilyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new family group. Requires authentication."""
    subscription = get_subscription(db, current_user.id)
    plan = effective_plan(subscription)
    limits = get_plan_limits(plan)

    if limits.get("max_families") is not None and current_user.family_id:
        raise HTTPException(
            status_code=403,
            detail="Plan limit reached. Upgrade to create an additional family.",
        )

    fam = FamilyGroup(
        name=payload.name,
        admin_password_hash=get_password_hash(payload.admin_password),
        created_at=datetime.utcnow(),
    )
    db.add(fam)
    db.commit()
    db.refresh(fam)

    # Automatically add the creator to the family
    current_user.family_id = fam.id
    db.commit()

    return fam


@router.get("/", response_model=List[FamilyOut])
def list_families(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """List families. Returns user's family if they belong to one."""
    if current_user.family_id:
        fam = db.get(FamilyGroup, current_user.family_id)
        return [fam] if fam else []
    return []


@router.get("/{family_id}", response_model=FamilyOut)
def get_family(
    family_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific family. User must belong to the family."""
    fam = db.get(FamilyGroup, family_id)
    if not fam:
        raise HTTPException(status_code=404, detail="Family not found")

    # Check if user belongs to this family
    if current_user.family_id != family_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return fam


@router.put("/{family_id}", response_model=FamilyOut)
def update_family(
    family_id: int,
    payload: FamilyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a family. Requires authentication and family membership."""
    fam = db.get(FamilyGroup, family_id)
    if not fam:
        raise HTTPException(status_code=404, detail="Family not found")

    # Check if user belongs to this family
    if current_user.family_id != family_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Update fields
    if payload.name is not None:
        fam.name = payload.name
    if payload.admin_password is not None:
        fam.admin_password_hash = get_password_hash(payload.admin_password)

    db.commit()
    db.refresh(fam)
    return fam


@router.delete("/{family_id}")
def delete_family(
    family_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a family. Requires authentication and family membership."""
    fam = db.get(FamilyGroup, family_id)
    if not fam:
        raise HTTPException(status_code=404, detail="Family not found")

    # Check if user belongs to this family
    if current_user.family_id != family_id:
        raise HTTPException(status_code=403, detail="Access denied")

    db.delete(fam)
    db.commit()
    return {"message": "Family deleted"}


@router.post("/{family_id}/invite")
def invite_member(
    family_id: int,
    payload: FamilyInvite,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Invite a member to the family. Requires authentication and family membership."""
    fam = db.get(FamilyGroup, family_id)
    if not fam:
        raise HTTPException(status_code=404, detail="Family not found")

    # Check if user belongs to this family
    if current_user.family_id != family_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Dev mock: In production, send email or generate tokenized link
    return {"message": f"Invite sent to {payload.email}"}
