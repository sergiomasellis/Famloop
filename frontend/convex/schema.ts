import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.string(),
    role: v.union(v.literal("parent"), v.literal("child")),
    familyId: v.optional(v.id("families")),
    profileImageUrl: v.optional(v.string()),
    iconEmoji: v.optional(v.string()),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_familyId", ["familyId"])
    .index("by_email", ["email"]),

  families: defineTable({
    name: v.string(),
    adminPin: v.optional(v.string()), // 4-6 digit PIN for parent access
    createdAt: v.number(),
  }),

  subscriptions: defineTable({
    userId: v.id("users"),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    priceId: v.optional(v.string()),
    plan: v.union(
      v.literal("free"),
      v.literal("family_plus"),
      v.literal("family_pro")
    ),
    status: v.string(),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_stripeSubscriptionId", ["stripeSubscriptionId"])
    .index("by_stripeCustomerId", ["stripeCustomerId"]),

  events: defineTable({
    familyId: v.id("families"),
    title: v.string(),
    description: v.optional(v.string()),
    emoji: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    source: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_familyId", ["familyId"])
    .index("by_familyId_time", ["familyId", "startTime"]),

  eventParticipants: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
  })
    .index("by_eventId", ["eventId"])
    .index("by_userId", ["userId"]),

  chores: defineTable({
    familyId: v.id("families"),
    title: v.string(),
    description: v.optional(v.string()),
    emoji: v.optional(v.string()),
    pointValue: v.number(),
    assignedToIds: v.optional(v.array(v.id("users"))),
    isGroupChore: v.boolean(),
    completed: v.boolean(),
    completedByIds: v.optional(v.array(v.id("users"))),
    weekStart: v.number(),
    isRecurring: v.boolean(),
    recurrenceType: v.optional(
      v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))
    ),
    recurrenceCount: v.optional(v.number()),
    daysOfWeek: v.optional(v.array(v.number())), // 0=Sun, 1=Mon, ..., 6=Sat (for weekly recurrence)
    maxCompletions: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_familyId", ["familyId"])
    .index("by_familyId_weekStart", ["familyId", "weekStart"]),

  choreCompletions: defineTable({
    choreId: v.id("chores"),
    userId: v.id("users"),
    completedAt: v.number(),
    pointsAwarded: v.number(),
  })
    .index("by_choreId", ["choreId"])
    .index("by_choreId_completedAt", ["choreId", "completedAt"])
    .index("by_userId", ["userId"]),

  points: defineTable({
    userId: v.id("users"),
    familyId: v.id("families"),
    choreId: v.optional(v.id("chores")),
    points: v.number(),
    awardedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_familyId", ["familyId"]),

  goals: defineTable({
    familyId: v.id("families"),
    name: v.string(),
    description: v.optional(v.string()),
    pointRequirement: v.optional(v.number()),
    prize: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_familyId", ["familyId"]),
});
