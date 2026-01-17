import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";

// Note: These actions use the Stripe API. In production, install and use the stripe package.
// For now, we'll use fetch to interact with the Stripe API directly.

const STRIPE_API_URL = "https://api.stripe.com/v1";

// Helper to make Stripe API requests
async function stripeRequest(
  endpoint: string,
  method: "GET" | "POST" | "DELETE",
  body?: Record<string, string>
) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${stripeSecretKey}`,
  };

  let requestBody: string | undefined;
  if (body) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    requestBody = new URLSearchParams(body).toString();
  }

  const response = await fetch(`${STRIPE_API_URL}${endpoint}`, {
    method,
    headers,
    body: requestBody,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Stripe API error");
  }

  return response.json();
}

// Create a Stripe checkout session
export const createCheckoutSession = action({
  args: {
    priceId: v.string(),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get user from Convex
    const user = await ctx.runQuery(api.users.getByClerkId, {
      clerkId: identity.subject,
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Check for existing subscription with Stripe customer
    const subscription = await ctx.runQuery(api.subscriptions.getByUserId, {
      userId: user._id,
    });

    // Create Stripe checkout session
    const sessionData: Record<string, string> = {
      mode: "subscription",
      "line_items[0][price]": args.priceId,
      "line_items[0][quantity]": "1",
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      "metadata[userId]": user._id,
    };

    // If user already has a Stripe customer ID, use it
    if (subscription && "stripeCustomerId" in subscription && subscription.stripeCustomerId) {
      sessionData.customer = subscription.stripeCustomerId;
    } else if (user.email) {
      sessionData.customer_email = user.email;
    }

    const session = await stripeRequest("/checkout/sessions", "POST", sessionData);

    return {
      sessionId: session.id,
      url: session.url,
    };
  },
});

// Create a Stripe customer portal session
export const createPortalSession = action({
  args: {
    returnUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get user from Convex
    const user = await ctx.runQuery(api.users.getByClerkId, {
      clerkId: identity.subject,
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Get subscription with Stripe customer ID
    const subscription = await ctx.runQuery(api.subscriptions.getByUserId, {
      userId: user._id,
    });

    if (!subscription || !("stripeCustomerId" in subscription) || !subscription.stripeCustomerId) {
      throw new Error("No active subscription found");
    }

    // Create portal session
    const session = await stripeRequest(
      "/billing_portal/sessions",
      "POST",
      {
        customer: subscription.stripeCustomerId,
        return_url: args.returnUrl,
      }
    );

    return {
      url: session.url,
    };
  },
});

// Cancel subscription via Stripe
export const cancelSubscription = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get user from Convex
    const user = await ctx.runQuery(api.users.getByClerkId, {
      clerkId: identity.subject,
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Get subscription
    const subscription = await ctx.runQuery(api.subscriptions.getByUserId, {
      userId: user._id,
    });

    if (
      !subscription ||
      !("stripeSubscriptionId" in subscription) ||
      !subscription.stripeSubscriptionId
    ) {
      throw new Error("No active subscription found");
    }

    // Cancel subscription at period end
    await stripeRequest(
      `/subscriptions/${subscription.stripeSubscriptionId}`,
      "POST",
      {
        cancel_at_period_end: "true",
      }
    );

    // Update local subscription record
    await ctx.runMutation(api.subscriptions.cancelSubscription);

    return { success: true };
  },
});

// Get available pricing plans
export const getPricingPlans = query({
  args: {},
  handler: async () => {
    // Return static pricing plans
    // In production, you might fetch these from Stripe or a config
    return [
      {
        id: "free",
        name: "Free",
        price: 0,
        interval: "month",
        features: [
          "Up to 2 family members",
          "Basic calendar",
          "Up to 5 chores",
          "Basic points tracking",
        ],
      },
      {
        id: "family_plus",
        name: "Family+",
        price: 4.99,
        interval: "month",
        priceId: process.env.STRIPE_FAMILY_PLUS_PRICE_ID,
        features: [
          "Up to 6 family members",
          "Full calendar features",
          "Up to 50 chores",
          "Advanced points & rewards",
          "Weekly reports",
        ],
      },
      {
        id: "family_pro",
        name: "Family Pro",
        price: 9.99,
        interval: "month",
        priceId: process.env.STRIPE_FAMILY_PRO_PRICE_ID,
        features: [
          "Unlimited family members",
          "All calendar features",
          "Unlimited chores",
          "Full gamification suite",
          "Priority support",
          "AI chore suggestions",
        ],
      },
    ];
  },
});
