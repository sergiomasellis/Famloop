# Billing and Subscriptions (Stripe)

This project uses Stripe Checkout + Billing Portal for subscriptions.

## Plans

| Plan          | Monthly | Annual (~20% off) | Limits                          | Notes                                     |
| ------------- | ------- | ----------------- | -------------------------------- | ----------------------------------------- |
| Free          | $0      | $0                | 1 family, up to 2 kids          | Basic chores + calendar                   |
| Family Plus   | $10     | $96               | 1 family, up to 6 kids          | Recurring chores, rewards, calendar share |
| Family Pro    | $18     | $172.80           | 1 family, unlimited kids        | Integrations (Google/ICS), priority support |

Limits are enforced server-side (children per family, recurring chores on paid plans).

## Required environment variables

Set these in `backend/.env` (or environment):

```
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_CHECKOUT_SUCCESS_URL=https://app.example.com/dashboard/billing
STRIPE_CHECKOUT_CANCEL_URL=https://app.example.com/pricing
STRIPE_BILLING_RETURN_URL=https://app.example.com/dashboard/billing
STRIPE_PRICE_FAMILY_PLUS_MONTHLY=price_xxx
STRIPE_PRICE_FAMILY_PLUS_ANNUAL=price_xxx
STRIPE_PRICE_FAMILY_PRO_MONTHLY=price_xxx
STRIPE_PRICE_FAMILY_PRO_ANNUAL=price_xxx
```

## Backend endpoints (auth required unless noted)

- `GET /api/billing/plans` – public plan catalog (shows only configured prices)
- `GET /api/billing/subscription` – current user's subscription summary
- `POST /api/billing/checkout` – create Stripe Checkout Session (`price_id` required)
- `POST /api/billing/portal` – create Billing Portal session
- `POST /api/billing/cancel` – set cancel_at_period_end on current subscription
- `POST /api/billing/resume` – clear cancel_at_period_end
- `POST /api/billing/webhook` – Stripe webhook (verify signature)

## Frontend notes

- Pricing page: `/pricing`
- Billing management page: `/dashboard/billing` (protected)
- Auth context now exposes `subscription` for gating premium features.

## Local testing tips

- Use Stripe test keys and test cards.
- Webhooks: `stripe listen --forward-to localhost:8000/api/billing/webhook`

