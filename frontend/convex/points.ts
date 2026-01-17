import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get total points for a user
export const getUserTotalPoints = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const points = await ctx.db
      .query("points")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    return points.reduce((sum, p) => sum + p.points, 0);
  },
});

// Get current user's total points
export const getCurrentUserPoints = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return 0;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return 0;
    }

    const points = await ctx.db
      .query("points")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    return points.reduce((sum, p) => sum + p.points, 0);
  },
});

// Get points for a user within a date range
export const getUserPointsInRange = query({
  args: {
    userId: v.id("users"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const points = await ctx.db
      .query("points")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.gte(q.field("awardedAt"), args.startDate),
          q.lte(q.field("awardedAt"), args.endDate)
        )
      )
      .collect();

    return points.reduce((sum, p) => sum + p.points, 0);
  },
});

// Get leaderboard for a family
export const getFamilyLeaderboard = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    // Get all family members
    const members = await ctx.db
      .query("users")
      .withIndex("by_familyId", (q) => q.eq("familyId", args.familyId))
      .collect();

    // Calculate points for each member
    const leaderboard = await Promise.all(
      members.map(async (member) => {
        const points = await ctx.db
          .query("points")
          .withIndex("by_userId", (q) => q.eq("userId", member._id))
          .collect();

        const totalPoints = points.reduce((sum, p) => sum + p.points, 0);

        return {
          user: member,
          totalPoints,
        };
      })
    );

    // Sort by points descending
    return leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
  },
});

// Get current family's leaderboard
export const getCurrentFamilyLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user?.familyId) {
      return [];
    }

    // Get all family members
    const members = await ctx.db
      .query("users")
      .withIndex("by_familyId", (q) => q.eq("familyId", user.familyId))
      .collect();

    // Calculate points for each member
    const leaderboard = await Promise.all(
      members.map(async (member) => {
        const points = await ctx.db
          .query("points")
          .withIndex("by_userId", (q) => q.eq("userId", member._id))
          .collect();

        const totalPoints = points.reduce((sum, p) => sum + p.points, 0);

        return {
          user: member,
          totalPoints,
        };
      })
    );

    // Sort by points descending
    return leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
  },
});

// Get weekly leaderboard for a family
export const getWeeklyLeaderboard = query({
  args: {
    familyId: v.id("families"),
    weekStart: v.number(),
  },
  handler: async (ctx, args) => {
    const weekEnd = args.weekStart + 7 * 24 * 60 * 60 * 1000;

    // Get all family members
    const members = await ctx.db
      .query("users")
      .withIndex("by_familyId", (q) => q.eq("familyId", args.familyId))
      .collect();

    // Calculate weekly points for each member
    const leaderboard = await Promise.all(
      members.map(async (member) => {
        const points = await ctx.db
          .query("points")
          .withIndex("by_userId", (q) => q.eq("userId", member._id))
          .filter((q) =>
            q.and(
              q.gte(q.field("awardedAt"), args.weekStart),
              q.lt(q.field("awardedAt"), weekEnd)
            )
          )
          .collect();

        const weeklyPoints = points.reduce((sum, p) => sum + p.points, 0);

        return {
          user: member,
          weeklyPoints,
        };
      })
    );

    // Sort by points descending
    return leaderboard.sort((a, b) => b.weeklyPoints - a.weeklyPoints);
  },
});

// Get current family's weekly leaderboard
export const getCurrentFamilyWeeklyLeaderboard = query({
  args: {
    weekStart: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user?.familyId) {
      return [];
    }

    const weekEnd = args.weekStart + 7 * 24 * 60 * 60 * 1000;

    // Get all family members
    const members = await ctx.db
      .query("users")
      .withIndex("by_familyId", (q) => q.eq("familyId", user.familyId))
      .collect();

    // Calculate weekly points for each member
    const leaderboard = await Promise.all(
      members.map(async (member) => {
        const points = await ctx.db
          .query("points")
          .withIndex("by_userId", (q) => q.eq("userId", member._id))
          .filter((q) =>
            q.and(
              q.gte(q.field("awardedAt"), args.weekStart),
              q.lt(q.field("awardedAt"), weekEnd)
            )
          )
          .collect();

        const weeklyPoints = points.reduce((sum, p) => sum + p.points, 0);

        return {
          user: member,
          weeklyPoints,
        };
      })
    );

    // Sort by points descending
    return leaderboard.sort((a, b) => b.weeklyPoints - a.weeklyPoints);
  },
});

// Award bonus points (for parents)
export const awardBonus = mutation({
  args: {
    userId: v.id("users"),
    points: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "parent") {
      throw new Error("Only parents can award bonus points");
    }

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    if (targetUser.familyId !== currentUser.familyId) {
      throw new Error("Cannot award points to users outside your family");
    }

    const pointId = await ctx.db.insert("points", {
      userId: args.userId,
      familyId: currentUser.familyId!,
      points: args.points,
      awardedAt: Date.now(),
    });

    return pointId;
  },
});

// Get recent point history for a user
export const getRecentHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const points = await ctx.db
      .query("points")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    // Get chore details for each point entry
    const historyWithChores = await Promise.all(
      points.map(async (point) => {
        const chore = point.choreId ? await ctx.db.get(point.choreId) : null;
        return {
          ...point,
          chore,
        };
      })
    );

    return historyWithChores;
  },
});
