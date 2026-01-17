"use client";

import { createContext, useContext, ReactNode } from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// User type matching Convex schema
export type User = {
  _id: Id<"users">;
  clerkId: string;
  name: string;
  email?: string;
  role: "parent" | "child";
  familyId?: Id<"families">;
  profileImageUrl?: string;
  iconEmoji?: string;
};

// Subscription type
export type Subscription = {
  _id?: Id<"subscriptions">;
  plan: "free" | "family_plus" | "family_pro";
  status: string;
  cancelAtPeriodEnd: boolean;
  limits: {
    familyMembers: number;
    events: number;
    chores: number;
  };
  currentPeriodEnd?: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
};

type AuthContextType = {
  user: User | null;
  subscription: Subscription | null;
  loading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut } = useClerkAuth();

  // Query user from Convex (synced from Clerk webhook)
  const convexUser = useQuery(
    api.users.getCurrentUser,
    clerkUser ? {} : "skip"
  );

  // Query subscription
  const subscription = useQuery(
    api.subscriptions.getCurrentSubscription,
    clerkUser ? {} : "skip"
  );

  // Determine loading state - only wait for Clerk to load
  const loading = !clerkLoaded;

  // Create a user object that uses Clerk data as fallback if Convex user doesn't exist yet
  const user: User | null = convexUser
    ? (convexUser as User)
    : clerkUser
      ? {
          _id: "" as Id<"users">, // Placeholder until Convex user is created
          clerkId: clerkUser.id,
          name: clerkUser.fullName || clerkUser.firstName || "User",
          email: clerkUser.primaryEmailAddress?.emailAddress,
          role: "parent" as const,
          profileImageUrl: clerkUser.imageUrl,
        }
      : null;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        subscription: subscription as Subscription | null,
        loading,
        // isAuthenticated is based on Clerk only - Convex user might not exist yet for new users
        isAuthenticated: !!clerkUser,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
