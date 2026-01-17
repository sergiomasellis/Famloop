import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Plan types and their limits
const PLAN_LIMITS = {
  free: { familyMembers: 2, events: 10, chores: 5 },
  family_plus: { familyMembers: 6, events: 100, chores: 50 },
  family_pro: { familyMembers: 999, events: 999, chores: 999 },
} as const;

// Get current user's subscription
export const getCurrentSubscription = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return null;
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!subscription) {
      // Return default free plan
      return {
        plan: "free" as const,
        status: "active",
        cancelAtPeriodEnd: false,
        limits: PLAN_LIMITS.free,
      };
    }

    return {
      ...subscription,
      limits: PLAN_LIMITS[subscription.plan],
    };
  },
});

// Get subscription by user ID
export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!subscription) {
      return {
        plan: "free" as const,
        status: "active",
        cancelAtPeriodEnd: false,
        limits: PLAN_LIMITS.free,
      };
    }

    return {
      ...subscription,
      limits: PLAN_LIMITS[subscription.plan],
    };
  },
});

// Internal: Handle checkout session completed
export const handleCheckoutComplete = internalMutation({
  args: {
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      console.error("No userId in checkout session metadata");
      return;
    }

    // Find user by ID (from metadata)
    const user = await ctx.db.get(args.userId as Id<"users">);
    if (!user) {
      console.error("User not found:", args.userId);
      return;
    }

    // Check for existing subscription
    const existingSub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (existingSub) {
      // Update existing subscription
      await ctx.db.patch(existingSub._id, {
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        status: "active",
      });
    } else {
      // Create new subscription (will be updated with full details from subscription webhook)
      await ctx.db.insert("subscriptions", {
        userId: user._id,
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        plan: "family_plus", // Default, will be updated
        status: "active",
        cancelAtPeriodEnd: false,
      });
    }
  },
});

// Internal: Sync subscription from Stripe webhook
export const syncSubscription = internalMutation({
  args: {
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    status: v.string(),
    priceId: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Find subscription by Stripe subscription ID
    let subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripeSubscriptionId", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .unique();

    // If not found, try by customer ID
    if (!subscription) {
      subscription = await ctx.db
        .query("subscriptions")
        .withIndex("by_stripeCustomerId", (q) =>
          q.eq("stripeCustomerId", args.stripeCustomerId)
        )
        .unique();
    }

    if (!subscription) {
      console.error(
        "Subscription not found for:",
        args.stripeSubscriptionId,
        args.stripeCustomerId
      );
      return;
    }

    // Determine plan from price ID (you'd map these to your Stripe price IDs)
    let plan: "free" | "family_plus" | "family_pro" = "free";
    if (args.priceId) {
      // Map price IDs to plans - update these with your actual Stripe price IDs
      const priceIdToPlan: Record<string, "free" | "family_plus" | "family_pro"> = {
        // Add your Stripe price IDs here
        price_family_plus_monthly: "family_plus",
        price_family_plus_yearly: "family_plus",
        price_family_pro_monthly: "family_pro",
        price_family_pro_yearly: "family_pro",
      };
      plan = priceIdToPlan[args.priceId] || subscription.plan;
    }

    // Handle deleted/canceled subscriptions
    if (args.status === "canceled" || args.status === "unpaid") {
      plan = "free";
    }

    await ctx.db.patch(subscription._id, {
      stripeSubscriptionId: args.stripeSubscriptionId,
      status: args.status,
      priceId: args.priceId,
      plan,
      currentPeriodEnd: args.currentPeriodEnd
        ? args.currentPeriodEnd * 1000
        : undefined, // Convert to ms
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
    });
  },
});

// Create initial free subscription for a user
export const createFreeSubscription = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if subscription already exists
    const existingSub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (existingSub) {
      return existingSub._id;
    }

    // Create free subscription
    const subscriptionId = await ctx.db.insert("subscriptions", {
      userId: user._id,
      plan: "free",
      status: "active",
      cancelAtPeriodEnd: false,
    });

    return subscriptionId;
  },
});

// Cancel subscription (set to cancel at period end)
export const cancelSubscription = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!subscription) {
      throw new Error("No subscription found");
    }

    // Mark as canceling at period end
    // The actual cancellation is handled via Stripe API (see billing.ts)
    await ctx.db.patch(subscription._id, {
      cancelAtPeriodEnd: true,
    });

    return subscription._id;
  },
});
