import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get chores for a family for a specific week
export const getByFamilyAndWeek = query({
  args: {
    familyId: v.id("families"),
    weekStart: v.number(),
  },
  handler: async (ctx, args) => {
    const chores = await ctx.db
      .query("chores")
      .withIndex("by_familyId_weekStart", (q) =>
        q.eq("familyId", args.familyId).eq("weekStart", args.weekStart)
      )
      .collect();

    // Get completions for each chore
    const choresWithCompletions = await Promise.all(
      chores.map(async (chore) => {
        const completions = await ctx.db
          .query("choreCompletions")
          .withIndex("by_choreId", (q) => q.eq("choreId", chore._id))
          .collect();

        // Get user details for each completion
        const completionsWithUsers = await Promise.all(
          completions.map(async (completion) => {
            const user = await ctx.db.get(completion.userId);
            return {
              ...completion,
              user,
            };
          })
        );

        // Get assigned users
        const assignedUsers = chore.assignedToIds
          ? await Promise.all(
              chore.assignedToIds.map(async (userId) => {
                return await ctx.db.get(userId);
              })
            )
          : [];

        return {
          ...chore,
          completions: completionsWithUsers,
          assignedTo: assignedUsers.filter(Boolean),
          completionCount: completions.length,
        };
      })
    );

    return choresWithCompletions;
  },
});

// Get current family's chores for a week
export const getCurrentFamilyChores = query({
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

    const chores = await ctx.db
      .query("chores")
      .withIndex("by_familyId_weekStart", (q) =>
        q.eq("familyId", user.familyId!).eq("weekStart", args.weekStart)
      )
      .collect();

    // Get completions and assigned users for each chore
    const choresWithDetails = await Promise.all(
      chores.map(async (chore) => {
        const completions = await ctx.db
          .query("choreCompletions")
          .withIndex("by_choreId", (q) => q.eq("choreId", chore._id))
          .collect();

        const completionsWithUsers = await Promise.all(
          completions.map(async (completion) => {
            const completedByUser = await ctx.db.get(completion.userId);
            return {
              ...completion,
              user: completedByUser,
            };
          })
        );

        const assignedUsers = chore.assignedToIds
          ? await Promise.all(
              chore.assignedToIds.map(async (userId) => {
                return await ctx.db.get(userId);
              })
            )
          : [];

        return {
          ...chore,
          completions: completionsWithUsers,
          assignedTo: assignedUsers.filter(Boolean),
          completionCount: completions.length,
        };
      })
    );

    return choresWithDetails;
  },
});

// Get a single chore by ID
export const getById = query({
  args: { id: v.id("chores") },
  handler: async (ctx, args) => {
    const chore = await ctx.db.get(args.id);
    if (!chore) return null;

    const completions = await ctx.db
      .query("choreCompletions")
      .withIndex("by_choreId", (q) => q.eq("choreId", chore._id))
      .collect();

    const assignedUsers = chore.assignedToIds
      ? await Promise.all(
          chore.assignedToIds.map(async (userId) => {
            return await ctx.db.get(userId);
          })
        )
      : [];

    return {
      ...chore,
      completions,
      assignedTo: assignedUsers.filter(Boolean),
      completionCount: completions.length,
    };
  },
});

// Create a new chore
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    emoji: v.optional(v.string()),
    pointValue: v.number(),
    assignedToIds: v.optional(v.array(v.id("users"))),
    isGroupChore: v.optional(v.boolean()),
    weekStart: v.number(),
    isRecurring: v.optional(v.boolean()),
    recurrenceType: v.optional(
      v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))
    ),
    recurrenceCount: v.optional(v.number()),
    daysOfWeek: v.optional(v.array(v.number())),
    maxCompletions: v.optional(v.number()),
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
      throw new Error("You must be part of a family to create chores");
    }

    // Only parents can create chores
    if (user.role !== "parent") {
      throw new Error("Only parents can create chores");
    }

    const choreId = await ctx.db.insert("chores", {
      familyId: user.familyId,
      title: args.title,
      description: args.description,
      emoji: args.emoji,
      pointValue: args.pointValue,
      assignedToIds: args.assignedToIds,
      isGroupChore: args.isGroupChore ?? false,
      completed: false,
      weekStart: args.weekStart,
      isRecurring: args.isRecurring ?? false,
      recurrenceType: args.recurrenceType,
      recurrenceCount: args.recurrenceCount,
      daysOfWeek: args.daysOfWeek,
      maxCompletions: args.maxCompletions,
      createdAt: Date.now(),
    });

    return choreId;
  },
});

// Update a chore
export const update = mutation({
  args: {
    id: v.id("chores"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    emoji: v.optional(v.string()),
    pointValue: v.optional(v.number()),
    assignedToIds: v.optional(v.array(v.id("users"))),
    isGroupChore: v.optional(v.boolean()),
    isRecurring: v.optional(v.boolean()),
    recurrenceType: v.optional(
      v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))
    ),
    recurrenceCount: v.optional(v.number()),
    daysOfWeek: v.optional(v.array(v.number())),
    maxCompletions: v.optional(v.number()),
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
      throw new Error("Only parents can update chores");
    }

    const chore = await ctx.db.get(args.id);
    if (!chore) {
      throw new Error("Chore not found");
    }

    if (chore.familyId !== user.familyId) {
      throw new Error("Cannot update chores from another family");
    }

    const updates: Partial<typeof chore> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.emoji !== undefined) updates.emoji = args.emoji;
    if (args.pointValue !== undefined) updates.pointValue = args.pointValue;
    if (args.assignedToIds !== undefined)
      updates.assignedToIds = args.assignedToIds;
    if (args.isGroupChore !== undefined) updates.isGroupChore = args.isGroupChore;
    if (args.isRecurring !== undefined) updates.isRecurring = args.isRecurring;
    if (args.recurrenceType !== undefined)
      updates.recurrenceType = args.recurrenceType;
    if (args.recurrenceCount !== undefined)
      updates.recurrenceCount = args.recurrenceCount;
    if (args.daysOfWeek !== undefined)
      updates.daysOfWeek = args.daysOfWeek;
    if (args.maxCompletions !== undefined)
      updates.maxCompletions = args.maxCompletions;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

// Delete a chore
export const remove = mutation({
  args: { id: v.id("chores") },
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
      throw new Error("Only parents can delete chores");
    }

    const chore = await ctx.db.get(args.id);
    if (!chore) {
      throw new Error("Chore not found");
    }

    if (chore.familyId !== user.familyId) {
      throw new Error("Cannot delete chores from another family");
    }

    // Delete all completions first
    const completions = await ctx.db
      .query("choreCompletions")
      .withIndex("by_choreId", (q) => q.eq("choreId", args.id))
      .collect();

    for (const completion of completions) {
      await ctx.db.delete(completion._id);
    }

    // Delete the chore
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Complete a chore
export const complete = mutation({
  args: {
    choreId: v.id("chores"),
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
      throw new Error("You must be part of a family");
    }

    const chore = await ctx.db.get(args.choreId);
    if (!chore) {
      throw new Error("Chore not found");
    }

    if (chore.familyId !== user.familyId) {
      throw new Error("Cannot complete chores from another family");
    }

    // Check if user is assigned to this chore (if not a group chore)
    if (
      !chore.isGroupChore &&
      chore.assignedToIds &&
      !chore.assignedToIds.includes(user._id)
    ) {
      throw new Error("You are not assigned to this chore");
    }

    // For recurring chores, check daily completion limit
    if (chore.isRecurring && chore.maxCompletions) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.getTime();
      const todayEnd = todayStart + 24 * 60 * 60 * 1000;

      const todayCompletions = await ctx.db
        .query("choreCompletions")
        .withIndex("by_choreId_completedAt", (q) =>
          q.eq("choreId", args.choreId).gte("completedAt", todayStart)
        )
        .filter((q) =>
          q.and(
            q.lt(q.field("completedAt"), todayEnd),
            q.eq(q.field("userId"), user._id)
          )
        )
        .collect();

      if (todayCompletions.length >= chore.maxCompletions) {
        throw new Error(
          `You've already completed this chore ${chore.maxCompletions} time(s) today`
        );
      }
    }

    // Create completion record
    const completionId = await ctx.db.insert("choreCompletions", {
      choreId: args.choreId,
      userId: user._id,
      completedAt: Date.now(),
      pointsAwarded: chore.pointValue,
    });

    // Award points
    await ctx.db.insert("points", {
      userId: user._id,
      familyId: user.familyId,
      choreId: args.choreId,
      points: chore.pointValue,
      awardedAt: Date.now(),
    });

    // Update chore completion status for non-recurring chores
    if (!chore.isRecurring) {
      const updatedCompletedByIds = [...(chore.completedByIds || []), user._id];
      await ctx.db.patch(args.choreId, {
        completed: true,
        completedByIds: updatedCompletedByIds,
      });
    }

    return completionId;
  },
});

// Uncomplete a chore (remove completion)
export const uncomplete = mutation({
  args: {
    choreId: v.id("chores"),
    completionId: v.optional(v.id("choreCompletions")),
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
      throw new Error("You must be part of a family");
    }

    const chore = await ctx.db.get(args.choreId);
    if (!chore) {
      throw new Error("Chore not found");
    }

    if (chore.familyId !== user.familyId) {
      throw new Error("Cannot uncomplete chores from another family");
    }

    // Find the completion to remove
    let completion;
    if (args.completionId) {
      completion = await ctx.db.get(args.completionId);
    } else {
      // Find the latest completion by this user
      const completions = await ctx.db
        .query("choreCompletions")
        .withIndex("by_choreId", (q) => q.eq("choreId", args.choreId))
        .filter((q) => q.eq(q.field("userId"), user._id))
        .collect();
      completion = completions[completions.length - 1];
    }

    if (!completion) {
      throw new Error("Completion not found");
    }

    // Only allow uncompleting your own completion (unless parent)
    if (completion.userId !== user._id && user.role !== "parent") {
      throw new Error("Cannot uncomplete someone else's completion");
    }

    // Remove the points
    const pointsToRemove = await ctx.db
      .query("points")
      .withIndex("by_userId", (q) => q.eq("userId", completion.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("choreId"), args.choreId),
          q.eq(q.field("awardedAt"), completion.completedAt)
        )
      )
      .first();

    if (pointsToRemove) {
      await ctx.db.delete(pointsToRemove._id);
    }

    // Delete the completion
    await ctx.db.delete(completion._id);

    // Update chore completion status for non-recurring chores
    if (!chore.isRecurring) {
      const remainingCompletions = await ctx.db
        .query("choreCompletions")
        .withIndex("by_choreId", (q) => q.eq("choreId", args.choreId))
        .collect();

      const completedByIds = remainingCompletions.map((c) => c.userId);
      await ctx.db.patch(args.choreId, {
        completed: remainingCompletions.length > 0,
        completedByIds: completedByIds.length > 0 ? completedByIds : undefined,
      });
    }

    return args.choreId;
  },
});
