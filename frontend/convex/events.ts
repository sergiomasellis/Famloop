import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get events for a family within a date range
export const getByFamilyAndDateRange = query({
  args: {
    familyId: v.id("families"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    // Get non-recurring events within the date range
    const nonRecurringEvents = await ctx.db
      .query("events")
      .withIndex("by_familyId_time", (q) =>
        q.eq("familyId", args.familyId).gte("startTime", args.startDate)
      )
      .filter((q) =>
        q.and(
          q.lte(q.field("startTime"), args.endDate),
          q.or(
            q.eq(q.field("isRecurring"), false),
            q.eq(q.field("isRecurring"), undefined)
          )
        )
      )
      .collect();

    // Get all recurring events for the family
    const recurringEvents = await ctx.db
      .query("events")
      .withIndex("by_familyId", (q) => q.eq("familyId", args.familyId))
      .filter((q) =>
        q.and(
          q.eq(q.field("isRecurring"), true),
          q.lte(q.field("startTime"), args.endDate),
          q.or(
            q.eq(q.field("recurrenceEndDate"), undefined),
            q.gte(q.field("recurrenceEndDate"), args.startDate)
          )
        )
      )
      .collect();

    const allEvents = [...nonRecurringEvents, ...recurringEvents];

    // Get participants for each event
    const eventsWithParticipants = await Promise.all(
      allEvents.map(async (event) => {
        const participants = await ctx.db
          .query("eventParticipants")
          .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
          .collect();

        const participantUsers = await Promise.all(
          participants.map(async (p) => {
            const user = await ctx.db.get(p.userId);
            return user;
          })
        );

        return {
          ...event,
          participants: participantUsers.filter(Boolean),
        };
      })
    );

    return eventsWithParticipants;
  },
});

// Get current family's events within a date range
export const getCurrentFamilyEvents = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
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

    // Get non-recurring events within the date range
    const nonRecurringEvents = await ctx.db
      .query("events")
      .withIndex("by_familyId_time", (q) =>
        q.eq("familyId", user.familyId!).gte("startTime", args.startDate)
      )
      .filter((q) =>
        q.and(
          q.lte(q.field("startTime"), args.endDate),
          q.or(
            q.eq(q.field("isRecurring"), false),
            q.eq(q.field("isRecurring"), undefined)
          )
        )
      )
      .collect();

    // Get all recurring events for the family (they might repeat into any range)
    // Only get recurring events that started before or during the range
    // and haven't ended before the range start
    const recurringEvents = await ctx.db
      .query("events")
      .withIndex("by_familyId", (q) => q.eq("familyId", user.familyId!))
      .filter((q) =>
        q.and(
          q.eq(q.field("isRecurring"), true),
          q.lte(q.field("startTime"), args.endDate),
          q.or(
            q.eq(q.field("recurrenceEndDate"), undefined),
            q.gte(q.field("recurrenceEndDate"), args.startDate)
          )
        )
      )
      .collect();

    const allEvents = [...nonRecurringEvents, ...recurringEvents];

    // Get participants for each event
    const eventsWithParticipants = await Promise.all(
      allEvents.map(async (event) => {
        const participants = await ctx.db
          .query("eventParticipants")
          .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
          .collect();

        const participantUsers = await Promise.all(
          participants.map(async (p) => {
            const user = await ctx.db.get(p.userId);
            return user;
          })
        );

        return {
          ...event,
          participants: participantUsers.filter(Boolean),
        };
      })
    );

    return eventsWithParticipants;
  },
});

// Get a single event by ID
export const getById = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.id);
    if (!event) return null;

    const participants = await ctx.db
      .query("eventParticipants")
      .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
      .collect();

    const participantUsers = await Promise.all(
      participants.map(async (p) => {
        const user = await ctx.db.get(p.userId);
        return user;
      })
    );

    return {
      ...event,
      participants: participantUsers.filter(Boolean),
    };
  },
});

// Create a new event
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    emoji: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    participantIds: v.optional(v.array(v.id("users"))),
    source: v.optional(v.string()),
    // Recurrence fields
    isRecurring: v.optional(v.boolean()),
    recurrenceType: v.optional(
      v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))
    ),
    recurrenceCount: v.optional(v.number()),
    daysOfWeek: v.optional(v.array(v.number())),
    recurrenceEndDate: v.optional(v.number()),
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
      throw new Error("You must be part of a family to create events");
    }

    // Create the event
    const eventId = await ctx.db.insert("events", {
      familyId: user.familyId,
      title: args.title,
      description: args.description,
      emoji: args.emoji,
      startTime: args.startTime,
      endTime: args.endTime,
      source: args.source,
      createdAt: Date.now(),
      // Recurrence fields
      isRecurring: args.isRecurring ?? false,
      recurrenceType: args.recurrenceType,
      recurrenceCount: args.recurrenceCount,
      daysOfWeek: args.daysOfWeek,
      recurrenceEndDate: args.recurrenceEndDate,
    });

    // Add participants
    if (args.participantIds && args.participantIds.length > 0) {
      for (const participantId of args.participantIds) {
        await ctx.db.insert("eventParticipants", {
          eventId,
          userId: participantId,
        });
      }
    }

    return eventId;
  },
});

// Update an event
export const update = mutation({
  args: {
    id: v.id("events"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    emoji: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    participantIds: v.optional(v.array(v.id("users"))),
    // Recurrence fields
    isRecurring: v.optional(v.boolean()),
    recurrenceType: v.optional(
      v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))
    ),
    recurrenceCount: v.optional(v.number()),
    daysOfWeek: v.optional(v.array(v.number())),
    recurrenceEndDate: v.optional(v.number()),
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

    const event = await ctx.db.get(args.id);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.familyId !== user.familyId) {
      throw new Error("Cannot update events from another family");
    }

    // Update event fields
    const updates: Partial<{
      title: string;
      description: string;
      emoji: string;
      startTime: number;
      endTime: number;
      isRecurring: boolean;
      recurrenceType: "daily" | "weekly" | "monthly";
      recurrenceCount: number;
      daysOfWeek: number[];
      recurrenceEndDate: number;
    }> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.emoji !== undefined) updates.emoji = args.emoji;
    if (args.startTime !== undefined) updates.startTime = args.startTime;
    if (args.endTime !== undefined) updates.endTime = args.endTime;
    // Recurrence fields
    if (args.isRecurring !== undefined) updates.isRecurring = args.isRecurring;
    if (args.recurrenceType !== undefined) updates.recurrenceType = args.recurrenceType;
    if (args.recurrenceCount !== undefined) updates.recurrenceCount = args.recurrenceCount;
    if (args.daysOfWeek !== undefined) updates.daysOfWeek = args.daysOfWeek;
    if (args.recurrenceEndDate !== undefined) updates.recurrenceEndDate = args.recurrenceEndDate;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.id, updates);
    }

    // Update participants if provided
    if (args.participantIds !== undefined) {
      // Remove existing participants
      const existingParticipants = await ctx.db
        .query("eventParticipants")
        .withIndex("by_eventId", (q) => q.eq("eventId", args.id))
        .collect();

      for (const participant of existingParticipants) {
        await ctx.db.delete(participant._id);
      }

      // Add new participants
      for (const participantId of args.participantIds) {
        await ctx.db.insert("eventParticipants", {
          eventId: args.id,
          userId: participantId,
        });
      }
    }

    return args.id;
  },
});

// Delete an event
export const remove = mutation({
  args: { id: v.id("events") },
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

    const event = await ctx.db.get(args.id);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.familyId !== user.familyId) {
      throw new Error("Cannot delete events from another family");
    }

    // Delete participants first
    const participants = await ctx.db
      .query("eventParticipants")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.id))
      .collect();

    for (const participant of participants) {
      await ctx.db.delete(participant._id);
    }

    // Delete the event
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Move event (update start and end times)
export const move = mutation({
  args: {
    id: v.id("events"),
    startTime: v.number(),
    endTime: v.number(),
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

    const event = await ctx.db.get(args.id);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.familyId !== user.familyId) {
      throw new Error("Cannot move events from another family");
    }

    await ctx.db.patch(args.id, {
      startTime: args.startTime,
      endTime: args.endTime,
    });

    return args.id;
  },
});
