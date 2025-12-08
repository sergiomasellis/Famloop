from __future__ import annotations

import logging
from datetime import datetime
from typing import List

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from ..config import settings
from ..db.session import get_db
from ..models.models import User
from ..schemas.schemas import (
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    InvoiceOut,
    PlanPublic,
    PortalSessionRequest,
    PortalSessionResponse,
    SubscriptionOut,
)
from ..services.subscriptions import (
    available_plans,
    effective_plan,
    get_subscription,
    subscription_to_dict,
    upsert_subscription,
)
from .auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

if settings.stripe_secret_key:
    stripe.api_key = settings.stripe_secret_key


def _require_stripe():
    if not settings.stripe_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe is not configured",
        )


def _ensure_customer(db: Session, user: User):
    subscription = get_subscription(db, user.id)
    if subscription and subscription.stripe_customer_id:
        return subscription, subscription.stripe_customer_id

    _require_stripe()
    customer = stripe.Customer.create(
        email=user.email,
        name=user.name,
        metadata={"user_id": str(user.id)},
    )
    subscription = upsert_subscription(
        db=db,
        user=user,
        price_id=subscription.price_id if subscription else None,
        stripe_subscription_id=subscription.stripe_subscription_id if subscription else None,
        stripe_customer_id=customer.id,
        status=subscription.status if subscription else "inactive",
        current_period_end=subscription.current_period_end if subscription else None,
        cancel_at_period_end=subscription.cancel_at_period_end if subscription else False,
    )
    return subscription, customer.id


@router.get("/plans", response_model=List[PlanPublic])
def list_plans():
    """Expose plan catalog to the frontend."""
    return [
        PlanPublic(
            name=plan.name,
            label=plan.label,
            description=plan.description,
            currency=plan.currency,
            monthly_price_cents=plan.monthly_price_cents,
            annual_price_cents=plan.annual_price_cents,
            price_monthly_id=plan.price_monthly_id,
            price_annual_id=plan.price_annual_id,
            max_children=plan.max_children,
            max_families=plan.max_families,
        )
        for plan in available_plans()
    ]


@router.get("/subscription", response_model=SubscriptionOut)
def subscription_status(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Return the current subscription status for the authenticated user."""
    subscription = get_subscription(db, current_user.id)
    return subscription_to_dict(subscription)


@router.post("/checkout", response_model=CheckoutSessionResponse)
def create_checkout_session(
    payload: CheckoutSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a Stripe Checkout Session for subscriptions."""
    _require_stripe()

    if not payload.price_id:
        raise HTTPException(status_code=400, detail="price_id is required")

    subscription, customer_id = _ensure_customer(db, current_user)

    valid_price_ids = {
        pid
        for plan in available_plans()
        for pid in (plan.price_monthly_id, plan.price_annual_id)
        if pid
    }
    if payload.price_id not in valid_price_ids:
        raise HTTPException(status_code=400, detail="Unknown or unsupported price_id")

    success_url = payload.success_url or settings.stripe_checkout_success_url
    cancel_url = payload.cancel_url or settings.stripe_checkout_cancel_url

    if not success_url or not cancel_url:
        raise HTTPException(
            status_code=500,
            detail="Stripe success/cancel URLs are not configured",
        )

    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            customer=customer_id,
            line_items=[{"price": payload.price_id, "quantity": 1}],
            success_url=success_url + "?session_id={CHECKOUT_SESSION_ID}",
            cancel_url=cancel_url,
            subscription_data={
                "metadata": {
                    "user_id": str(current_user.id),
                    "email": current_user.email or "",
                }
            },
            metadata={"user_id": str(current_user.id)},
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("Stripe checkout session error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=500, detail="Unable to create checkout session"
        ) from exc

    # Pre-create row to ensure we have a record
    upsert_subscription(
        db=db,
        user=current_user,
        price_id=payload.price_id,
        stripe_subscription_id=subscription.stripe_subscription_id
        if subscription
        else None,
        stripe_customer_id=customer_id,
        status=subscription.status if subscription else "incomplete",
        current_period_end=subscription.current_period_end if subscription else None,
        cancel_at_period_end=subscription.cancel_at_period_end if subscription else False,
    )

    return CheckoutSessionResponse(session_id=session["id"], url=session["url"])


@router.post("/portal", response_model=PortalSessionResponse)
def create_billing_portal_session(
    payload: PortalSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a Stripe Billing Portal session."""
    _require_stripe()

    subscription = get_subscription(db, current_user.id)
    if not subscription or not subscription.stripe_customer_id:
        raise HTTPException(
            status_code=400,
            detail="No Stripe customer found for this user. Start a subscription first.",
        )

    return_url = payload.return_url or settings.stripe_billing_return_url
    if not return_url:
        raise HTTPException(status_code=500, detail="Billing return URL is not set")

    session = stripe.billing_portal.Session.create(
        customer=subscription.stripe_customer_id,
        return_url=return_url,
    )
    return PortalSessionResponse(url=session["url"])


@router.post("/cancel", response_model=SubscriptionOut)
def cancel_subscription(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Set cancel_at_period_end for the current subscription."""
    _require_stripe()

    subscription = get_subscription(db, current_user.id)
    if not subscription or not subscription.stripe_subscription_id:
        raise HTTPException(status_code=404, detail="No active subscription found")

    stripe_sub = stripe.Subscription.modify(
        subscription.stripe_subscription_id, cancel_at_period_end=True
    )
    _sync_subscription_from_stripe(db, stripe_sub)
    updated = get_subscription(db, current_user.id)
    return subscription_to_dict(updated)


@router.post("/resume", response_model=SubscriptionOut)
def resume_subscription(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Clear cancel_at_period_end and resume billing."""
    _require_stripe()

    subscription = get_subscription(db, current_user.id)
    if not subscription or not subscription.stripe_subscription_id:
        raise HTTPException(status_code=404, detail="No active subscription found")

    stripe_sub = stripe.Subscription.modify(
        subscription.stripe_subscription_id, cancel_at_period_end=False
    )
    _sync_subscription_from_stripe(db, stripe_sub)
    updated = get_subscription(db, current_user.id)
    return subscription_to_dict(updated)


@router.get("/invoices", response_model=List[InvoiceOut])
def list_invoices(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """List recent invoices/charges for the current user."""
    _require_stripe()

    subscription = get_subscription(db, current_user.id)
    if not subscription or not subscription.stripe_customer_id:
        raise HTTPException(
            status_code=400, detail="No billing history found for this user"
        )

    try:
        invoices = stripe.Invoice.list(
            customer=subscription.stripe_customer_id, limit=12
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("Stripe invoice list error: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Unable to fetch invoices") from exc

    results: List[InvoiceOut] = []
    for inv in invoices.auto_paging_iter():
        results.append(
            InvoiceOut(
                id=inv["id"],
                status=inv.get("status", ""),
                amount_due=inv.get("amount_due", 0),
                amount_paid=inv.get("amount_paid", 0),
                currency=inv.get("currency", "usd"),
                hosted_invoice_url=inv.get("hosted_invoice_url"),
                invoice_pdf=inv.get("invoice_pdf"),
                created=datetime.utcfromtimestamp(inv["created"]),
                period_start=datetime.utcfromtimestamp(inv["period_start"])
                if inv.get("period_start")
                else None,
                period_end=datetime.utcfromtimestamp(inv["period_end"])
                if inv.get("period_end")
                else None,
            )
        )

    return results


def _sync_subscription_from_stripe(db: Session, stripe_subscription: dict):
    """Update local subscription from a Stripe subscription object."""
    user_id = stripe_subscription.get("metadata", {}).get("user_id")
    if not user_id:
        logger.warning("Stripe subscription missing user_id metadata")
        return

    try:
        user_id_int = int(user_id)
    except ValueError:
        logger.warning("Invalid user_id metadata on Stripe subscription: %s", user_id)
        return

    user = db.get(User, user_id_int)
    if not user:
        logger.warning("User %s not found for Stripe webhook", user_id_int)
        return

    price_id = None
    try:
        items = stripe_subscription.get("items", {}).get("data", [])
        if items:
            price_id = items[0]["price"]["id"]
    except Exception:  # noqa: BLE001
        logger.warning("Unable to read price_id from Stripe subscription payload")

    current_period_end = stripe_subscription.get("current_period_end")
    current_period_end_dt = (
        datetime.utcfromtimestamp(current_period_end)
        if current_period_end
        else None
    )

    upsert_subscription(
        db=db,
        user=user,
        price_id=price_id,
        stripe_subscription_id=stripe_subscription.get("id"),
        stripe_customer_id=stripe_subscription.get("customer"),
        status=stripe_subscription.get("status", "inactive"),
        current_period_end=current_period_end_dt,
        cancel_at_period_end=stripe_subscription.get("cancel_at_period_end", False),
    )


@router.post("/webhook", include_in_schema=False)
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhook events."""
    _require_stripe()

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not settings.stripe_webhook_secret:
        raise HTTPException(status_code=500, detail="Webhook secret not configured")

    try:
        event = stripe.Webhook.construct_event(
            payload=payload.decode(),
            sig_header=sig_header,
            secret=settings.stripe_webhook_secret,
        )
    except ValueError as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="Invalid payload") from exc
    except stripe.error.SignatureVerificationError as exc:
        raise HTTPException(status_code=400, detail="Invalid signature") from exc

    event_type = event["type"]
    data_object = event["data"]["object"]

    logger.info("Received Stripe event %s", event_type)

    if event_type == "checkout.session.completed":
        subscription_id = data_object.get("subscription")
        if subscription_id:
            stripe_subscription = stripe.Subscription.retrieve(subscription_id)
            _sync_subscription_from_stripe(db, stripe_subscription)
    elif event_type in {"customer.subscription.updated", "customer.subscription.deleted"}:
        _sync_subscription_from_stripe(db, data_object)
    elif event_type == "invoice.payment_failed":
        subscription_id = data_object.get("subscription")
        if subscription_id:
            stripe_subscription = stripe.Subscription.retrieve(subscription_id)
            _sync_subscription_from_stripe(db, stripe_subscription)

    return {"received": True}

