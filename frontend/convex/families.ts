import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get family by ID
export const getById = query({
  args: { id: v.id("families") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get current user's family
export const getCurrentFamily = query({
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

    if (!user?.familyId) {
      return null;
    }

    return await ctx.db.get(user.familyId);
  },
});

// Get family members
export const getMembers = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_familyId", (q) => q.eq("familyId", args.familyId))
      .collect();
  },
});

// Get current family members (uses authenticated user's family)
export const getCurrentFamilyMembers = query({
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
      .query("users")
      .withIndex("by_familyId", (q) => q.eq("familyId", user.familyId))
      .collect();
  },
});

// Create a new family
export const create = mutation({
  args: {
    name: v.string(),
    adminPin: v.optional(v.string()), // 4-6 digit PIN
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Validate PIN if provided (must be 4-6 digits)
    if (args.adminPin && !/^\d{4,6}$/.test(args.adminPin)) {
      throw new Error("PIN must be 4-6 digits");
    }

    let user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    // If user doesn't exist yet (webhook hasn't run), create them from JWT identity
    if (!user) {
      const userId = await ctx.db.insert("users", {
        clerkId: identity.subject,
        email: identity.email,
        name: identity.name || identity.email || "User",
        role: "parent", // First user creating a family is a parent
        profileImageUrl: identity.pictureUrl,
      });
      user = await ctx.db.get(userId);
      if (!user) {
        throw new Error("Failed to create user");
      }
    }

    // Create the family
    const familyId = await ctx.db.insert("families", {
      name: args.name,
      adminPin: args.adminPin,
      createdAt: Date.now(),
    });

    // Update user to belong to this family and ensure they're a parent
    await ctx.db.patch(user._id, { familyId, role: "parent" });

    return familyId;
  },
});

// Update family
export const update = mutation({
  args: {
    id: v.id("families"),
    name: v.optional(v.string()),
    adminPin: v.optional(v.string()), // 4-6 digit PIN
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Validate PIN if provided (must be 4-6 digits)
    if (args.adminPin && !/^\d{4,6}$/.test(args.adminPin)) {
      throw new Error("PIN must be 4-6 digits");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.role !== "parent") {
      throw new Error("Only parents can update family settings");
    }

    if (user.familyId !== args.id) {
      throw new Error("Cannot update another family");
    }

    const updates: Partial<{ name: string; adminPin: string }> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.adminPin !== undefined) updates.adminPin = args.adminPin;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

// Join a family (for child accounts)
export const join = mutation({
  args: {
    familyId: v.id("families"),
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

    if (!user) {
      throw new Error("User not found");
    }

    // Verify family exists
    const family = await ctx.db.get(args.familyId);
    if (!family) {
      throw new Error("Family not found");
    }

    // Update user's family
    await ctx.db.patch(user._id, { familyId: args.familyId });
    return user._id;
  },
});

// Leave family
export const leave = mutation({
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

    // Remove family association
    await ctx.db.patch(user._id, { familyId: undefined });
    return user._id;
  },
});

// Add a family member (parent adds child)
export const addMember = mutation({
  args: {
    name: v.string(),
    role: v.union(v.literal("parent"), v.literal("child")),
    iconEmoji: v.optional(v.string()),
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
      throw new Error("Only parents can add family members");
    }

    if (!user.familyId) {
      throw new Error("You must create or join a family first");
    }

    // Create a new user without Clerk ID (managed locally)
    // Generate a pseudo-Clerk ID for local users
    const localClerkId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newUserId = await ctx.db.insert("users", {
      clerkId: localClerkId,
      name: args.name,
      role: args.role,
      familyId: user.familyId,
      iconEmoji: args.iconEmoji,
    });

    return newUserId;
  },
});

// Remove a family member
export const removeMember = mutation({
  args: {
    userId: v.id("users"),
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
      throw new Error("Only parents can remove family members");
    }

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    if (targetUser.familyId !== user.familyId) {
      throw new Error("Cannot remove users from other families");
    }

    // Don't allow removing yourself
    if (targetUser._id === user._id) {
      throw new Error("Cannot remove yourself from the family");
    }

    // For local users (no real Clerk account), delete them
    // For Clerk users, just remove their family association
    if (targetUser.clerkId.startsWith("local_")) {
      await ctx.db.delete(args.userId);
    } else {
      await ctx.db.patch(args.userId, { familyId: undefined });
    }

    return args.userId;
  },
});
