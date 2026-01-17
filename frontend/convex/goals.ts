import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all goals for a family
export const getByFamilyId = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("goals")
      .withIndex("by_familyId", (q) => q.eq("familyId", args.familyId))
      .collect();
  },
});

// Get current family's goals
export const getCurrentFamilyGoals = query({
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

    return await ctx.db
      .query("goals")
      .withIndex("by_familyId", (q) => q.eq("familyId", user.familyId!))
      .collect();
  },
});

// Get a single goal by ID
export const getById = query({
  args: { id: v.id("goals") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create a new goal
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    pointRequirement: v.optional(v.number()),
    prize: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user?.familyId) {
      throw new Error("You must be part of a family to create goals");
    }

    // Only parents can create goals
    if (user.role !== "parent") {
      throw new Error("Only parents can create goals");
    }

    const goalId = await ctx.db.insert("goals", {
      familyId: user.familyId,
      name: args.name,
      description: args.description,
      pointRequirement: args.pointRequirement,
      prize: args.prize,
      createdAt: Date.now(),
    });

    return goalId;
  },
});

// Update a goal
export const update = mutation({
  args: {
    id: v.id("goals"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    pointRequirement: v.optional(v.number()),
    prize: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.role !== "parent") {
      throw new Error("Only parents can update goals");
    }

    const goal = await ctx.db.get(args.id);
    if (!goal) {
      throw new Error("Goal not found");
    }

    if (goal.familyId !== user.familyId) {
      throw new Error("Cannot update goals from another family");
    }

    const updates: Partial<{
      name: string;
      description: string;
      pointRequirement: number;
      prize: string;
    }> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.pointRequirement !== undefined)
      updates.pointRequirement = args.pointRequirement;
    if (args.prize !== undefined) updates.prize = args.prize;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

// Delete a goal
export const remove = mutation({
  args: { id: v.id("goals") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.role !== "parent") {
      throw new Error("Only parents can delete goals");
    }

    const goal = await ctx.db.get(args.id);
    if (!goal) {
      throw new Error("Goal not found");
    }

    if (goal.familyId !== user.familyId) {
      throw new Error("Cannot delete goals from another family");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});
