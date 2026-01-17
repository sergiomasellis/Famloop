# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FamLoop is a family calendar and chore management application with gamification features. It uses a Next.js frontend with Convex as the serverless backend.

## Common Commands

### Frontend (in `frontend/`)
```bash
bun install              # Install dependencies
bun run dev              # Start dev server (port 3000, turbopack)
npx convex dev           # Start Convex dev server (run in separate terminal)
bun run build            # Production build
bun run lint             # Run ESLint
bun run tsc --noEmit     # Type checking only
```

### Convex
```bash
npx convex dev           # Run Convex in development mode
npx convex deploy        # Deploy to production
npx convex dashboard     # Open Convex dashboard
```

### Legacy Backend (in `backend/` - deprecated, kept for reference)
```bash
uv sync                                           # Install dependencies
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000  # Dev server
uv run pytest tests/ -v                           # Run all tests
```

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript 5.9, Tailwind CSS 4.1, Radix UI
- **Backend**: Convex (serverless with real-time subscriptions)
- **Auth**: Clerk (OAuth, email/password)
- **Payments**: Stripe (via Convex HTTP actions)
- **Database**: Convex (built-in document database)

### Key Directories
- `frontend/src/app/` - Next.js pages (file-based routing)
- `frontend/src/features/` - Feature modules (calendar, chores, family, shell)
- `frontend/src/hooks/` - Custom hooks using Convex queries/mutations
- `frontend/src/contexts/AuthContext.tsx` - User/subscription state (Clerk + Convex)
- `frontend/convex/` - Convex backend functions
  - `schema.ts` - Database schema
  - `users.ts` - User queries/mutations
  - `families.ts` - Family CRUD operations
  - `events.ts` - Calendar events
  - `chores.ts` - Chore management with completions
  - `points.ts` - Points and leaderboard
  - `goals.ts` - Goals/rewards
  - `subscriptions.ts` - Stripe subscription management
  - `billing.ts` - Stripe checkout/portal actions
  - `http.ts` - Webhook handlers (Clerk, Stripe)

### Data Flow
1. User authenticates via Clerk (sign in/sign up)
2. Clerk webhook syncs user to Convex
3. Frontend uses `useQuery`/`useMutation` from Convex React
4. Data updates are real-time across all clients

### Core Tables (Convex Schema)
- `users` - Parent/child with roles, linked to Clerk
- `families` - Family unit containing users
- `events` - Calendar events with participants
- `eventParticipants` - Many-to-many event/user
- `chores` - Tasks with points, assignments, recurrence
- `choreCompletions` - Completion records
- `points` - Points earned
- `goals` - Rewards with point thresholds
- `subscriptions` - Stripe subscription state

## Style Guide (Neo-Brutalist)

The UI follows a Neo-Brutalist design system. Key principles:

### Always Use
- `border-2 border-border` for containers (adapts to dark mode)
- `shadow-[4px_4px_0px_0px_var(--shadow-color)]` for hard shadows
- Semantic color tokens: `bg-card`, `text-foreground`, `bg-primary`, etc.
- Hover effects: lift up with larger shadow
- Active effects: press down, shadow disappears

### Never Use
- Hardcoded colors like `border-black`, `bg-white`
- Blur shadows
- Low contrast combinations

See `docs/STYLE_GUIDE.md` for full design tokens and component patterns.

## Development Guidelines

### Commits
All commits require DCO sign-off:
```bash
git commit -s -m "feat: add feature"
```

Follow Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`

### Branching
- `feat/description` - New features
- `fix/description` - Bug fixes
- `chore/description` - Maintenance

### Environment Variables

Frontend requires these in `frontend/.env.local`:
```bash
# Convex
CONVEX_DEPLOYMENT=dev:your-deployment-id
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Clerk redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/calendar
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding/family

# Stripe (optional, for billing)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

Convex environment variables (set via `npx convex env set`):
```bash
CLERK_WEBHOOK_SECRET=whsec_xxx    # From Clerk dashboard
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

## Webhooks Configuration

### Clerk Webhook
1. Go to Clerk Dashboard > Webhooks
2. Add endpoint: `https://your-deployment.convex.site/clerk-webhook`
3. Subscribe to events: `user.created`, `user.updated`, `user.deleted`
4. Copy signing secret to Convex env as `CLERK_WEBHOOK_SECRET`

### Stripe Webhook
1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://your-deployment.convex.site/stripe-webhook`
3. Subscribe to events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy signing secret to Convex env as `STRIPE_WEBHOOK_SECRET`

## Real-time Features

Convex provides automatic real-time updates. All `useQuery` hooks subscribe to data changes:
- Events update across all family members' browsers instantly
- Chore completions and points update in real-time
- Leaderboard updates automatically when points change
