import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate a random token for invitation links
function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Get pending invitations for current user's family (parents only)
export const getPendingInvitations = query({
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

    if (!user || user.role !== "parent" || !user.familyId) {
      return [];
    }

    const invitations = await ctx.db
      .query("invitations")
      .withIndex("by_familyId", (q) => q.eq("familyId", user.familyId!))
      .collect();

    // Filter to only pending invitations
    return invitations.filter((inv) => inv.status === "pending");
  },
});

// Get invitation details by token (public, for accept flow)
export const getInvitationByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!invitation) {
      return null;
    }

    // Get family name for display
    const family = await ctx.db.get(invitation.familyId);

    // Get inviter name for display
    const inviter = await ctx.db.get(invitation.invitedBy);

    return {
      _id: invitation._id,
      familyId: invitation.familyId,
      familyName: family?.name ?? "Unknown Family",
      inviterName: inviter?.name ?? "Unknown",
      email: invitation.email,
      status: invitation.status,
      createdAt: invitation.createdAt,
      expiresAt: invitation.expiresAt,
      isExpired: Date.now() > invitation.expiresAt,
    };
  },
});

// Create a new invitation
export const createInvitation = mutation({
  args: { email: v.string() },
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
      throw new Error("Only parents can invite other parents");
    }

    if (!user.familyId) {
      throw new Error("You must be in a family to send invitations");
    }

    const email = args.email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Please enter a valid email address");
    }

    // Cannot invite yourself
    if (user.email?.toLowerCase() === email) {
      throw new Error("You cannot invite yourself");
    }

    // Check if email is already a family member
    const existingMember = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existingMember && existingMember.familyId === user.familyId) {
      throw new Error("This person is already a member of your family");
    }

    // Check for existing pending invitation to this email
    const existingInvitations = await ctx.db
      .query("invitations")
      .withIndex("by_email_status", (q) =>
        q.eq("email", email).eq("status", "pending")
      )
      .collect();

    const existingForFamily = existingInvitations.find(
      (inv) => inv.familyId === user.familyId
    );

    if (existingForFamily) {
      throw new Error("An invitation has already been sent to this email");
    }

    // Create invitation with 7 day expiration
    const token = generateToken();
    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

    const invitationId = await ctx.db.insert("invitations", {
      familyId: user.familyId,
      email,
      invitedBy: user._id,
      token,
      status: "pending",
      createdAt: now,
      expiresAt,
    });

    return { invitationId, token };
  },
});

// Cancel a pending invitation
export const cancelInvitation = mutation({
  args: { invitationId: v.id("invitations") },
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
      throw new Error("Only parents can cancel invitations");
    }

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.familyId !== user.familyId) {
      throw new Error("You can only cancel invitations for your own family");
    }

    if (invitation.status !== "pending") {
      throw new Error("This invitation is no longer pending");
    }

    await ctx.db.patch(args.invitationId, { status: "cancelled" });

    return { success: true };
  },
});

// Accept an invitation
export const acceptInvitation = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be logged in to accept an invitation");
    }

    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.status !== "pending") {
      throw new Error("This invitation is no longer valid");
    }

    if (Date.now() > invitation.expiresAt) {
      throw new Error("This invitation has expired");
    }

    // Get or create user
    let user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    // If user doesn't exist (webhook hasn't run yet), create them
    if (!user) {
      const userId = await ctx.db.insert("users", {
        clerkId: identity.subject,
        email: identity.email,
        name: identity.name || identity.email || "User",
        role: "parent", // Invited users become parents
        familyId: invitation.familyId,
        profileImageUrl: identity.pictureUrl,
      });
      user = await ctx.db.get(userId);
    } else {
      // If user already has a family, they need to leave it first
      // (We'll handle this by switching them to the new family)
      await ctx.db.patch(user._id, {
        familyId: invitation.familyId,
        role: "parent", // Ensure they're a parent
      });
    }

    // Mark invitation as accepted
    await ctx.db.patch(invitation._id, {
      status: "accepted",
      acceptedAt: Date.now(),
      acceptedBy: user?._id,
    });

    return { success: true, familyId: invitation.familyId };
  },
});
