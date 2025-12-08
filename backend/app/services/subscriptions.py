from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Literal, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..models.models import Subscription, User

PlanName = Literal["free", "family_plus", "family_pro"]


@dataclass
class PlanInfo:
    name: PlanName
    label: str
    description: str
    monthly_price_cents: int | None
    annual_price_cents: int | None
    currency: str
    price_monthly_id: str | None
    price_annual_id: str | None
    max_children: int | None
    max_families: int | None


def _plan_catalog() -> list[PlanInfo]:
    """Return the plan catalog using configured Stripe price IDs."""
    return [
        PlanInfo(
            name="free",
            label="Free",
            description="Basic chores and calendar for one household",
            monthly_price_cents=0,
            annual_price_cents=0,
            currency="usd",
            price_monthly_id=None,
            price_annual_id=None,
            max_children=2,
            max_families=1,
        ),
        PlanInfo(
            name="family_plus",
            label="Family Plus",
            description="Up to 6 kids, recurring chores, rewards, calendar sharing",
            monthly_price_cents=1000,  # $10.00
            annual_price_cents=9600,  # ~20% off
            currency="usd",
            price_monthly_id=settings.stripe_price_family_plus_monthly,
            price_annual_id=settings.stripe_price_family_plus_annual,
            max_children=6,
            max_families=1,
        ),
        PlanInfo(
            name="family_pro",
            label="Family Pro",
            description="Unlimited kids and integrations, priority support",
            monthly_price_cents=1800,  # $18.00
            annual_price_cents=17280,  # ~20% off
            currency="usd",
            price_monthly_id=settings.stripe_price_family_pro_monthly,
            price_annual_id=settings.stripe_price_family_pro_annual,
            max_children=None,  # unlimited
            max_families=1,
        ),
    ]


def price_to_plan(price_id: Optional[str]) -> PlanName:
    """Map a Stripe price ID to a plan name; fallback to free."""
    if not price_id:
        return "free"

    for plan in _plan_catalog():
        if price_id in (plan.price_monthly_id, plan.price_annual_id):
            return plan.name
    return "free"


def get_plan_limits(plan: PlanName) -> dict:
    """Return limit configuration for a plan."""
    plan_map = {plan.name: plan for plan in _plan_catalog()}
    selected = plan_map.get(plan, plan_map["free"])
    return {"max_children": selected.max_children, "max_families": selected.max_families}


def active_subscription(subscription: Optional[Subscription]) -> bool:
    """Determine if a subscription grants paid access."""
    if not subscription:
        return False
    return subscription.status in {"active", "trialing", "past_due"}


def effective_plan(subscription: Optional[Subscription]) -> PlanName:
    """Derive effective plan name from subscription."""
    if not active_subscription(subscription):
        return "free"
    return price_to_plan(subscription.price_id)


def get_subscription(db: Session, user_id: int) -> Optional[Subscription]:
    """Fetch the subscription for a user."""
    stmt = select(Subscription).where(Subscription.user_id == user_id)
    return db.execute(stmt).scalar_one_or_none()


def upsert_subscription(
    db: Session,
    user: User,
    price_id: Optional[str],
    stripe_subscription_id: Optional[str],
    stripe_customer_id: Optional[str],
    status: str,
    current_period_end: Optional[datetime],
    cancel_at_period_end: bool,
) -> Subscription:
    """Create or update a subscription row for a user."""
    subscription = get_subscription(db, user.id)
    if not subscription:
        subscription = Subscription(
            user_id=user.id,
            price_id=price_id,
            stripe_subscription_id=stripe_subscription_id,
            stripe_customer_id=stripe_customer_id,
            status=status,
            plan=price_to_plan(price_id),
            current_period_end=current_period_end,
            cancel_at_period_end=cancel_at_period_end,
        )
        db.add(subscription)
    else:
        subscription.price_id = price_id
        subscription.stripe_subscription_id = stripe_subscription_id
        subscription.stripe_customer_id = stripe_customer_id or subscription.stripe_customer_id
        subscription.status = status
        subscription.plan = price_to_plan(price_id)
        subscription.current_period_end = current_period_end
        subscription.cancel_at_period_end = cancel_at_period_end
        subscription.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(subscription)
    return subscription


def subscription_to_dict(subscription: Optional[Subscription]) -> dict:
    """Serialize subscription to a simple dict for responses."""
    if not subscription:
        return {
            "plan": "free",
            "status": "inactive",
            "price_id": None,
            "current_period_end": None,
            "cancel_at_period_end": False,
            "is_active": False,
        }

    return {
        "plan": effective_plan(subscription),
        "status": subscription.status,
        "price_id": subscription.price_id,
        "current_period_end": subscription.current_period_end,
        "cancel_at_period_end": subscription.cancel_at_period_end,
        "is_active": active_subscription(subscription),
    }


def available_plans() -> list[PlanInfo]:
    """Expose plans that have price IDs configured (plus free)."""
    plans: list[PlanInfo] = []
    for plan in _plan_catalog():
        if plan.name == "free":
            plans.append(plan)
            continue

        # Only include paid plans when a price ID is configured
        if plan.price_monthly_id or plan.price_annual_id:
            plans.append(plan)
    return plans

