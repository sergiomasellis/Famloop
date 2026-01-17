"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useCallback } from "react";

// Type matching Convex user schema
export type FamilyMember = {
  _id: Id<"users">;
  clerkId: string;
  name: string;
  email?: string;
  role: "parent" | "child";
  familyId?: Id<"families">;
  profileImageUrl?: string;
  iconEmoji?: string;
};

export function useFamilyMembers(familyId?: Id<"families">) {
  // Use getCurrentFamilyMembers which automatically uses the authenticated user's family
  const members = useQuery(
    api.families.getCurrentFamilyMembers,
    familyId ? {} : "skip"
  );

  const loading = members === undefined;
  const error = null;

  return {
    members: (members || []) as FamilyMember[],
    loading,
    error,
    // refetch is not needed with Convex - it's reactive
    refetch: () => {},
  };
}

export function useCreateFamilyMember() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addMemberMutation = useMutation(api.families.addMember);

  const createMember = useCallback(async (data: {
    name: string;
    role: "parent" | "child";
    iconEmoji?: string;
  }): Promise<FamilyMember | null> => {
    setLoading(true);
    setError(null);
    try {
      const memberId = await addMemberMutation({
        name: data.name,
        role: data.role,
        iconEmoji: data.iconEmoji,
      });
      // Return a minimal member object - the query will update automatically
      return {
        _id: memberId,
        clerkId: `local_${Date.now()}`,
        name: data.name,
        role: data.role,
        iconEmoji: data.iconEmoji,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create member";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [addMemberMutation]);

  return {
    createMember,
    loading,
    error,
  };
}

export function useUpdateFamilyMember() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateProfileMutation = useMutation(api.users.updateProfile);

  const updateMember = useCallback(async (userId: Id<"users">, data: {
    name?: string;
    iconEmoji?: string;
  }): Promise<FamilyMember | null> => {
    setLoading(true);
    setError(null);
    try {
      await updateProfileMutation({
        name: data.name,
        iconEmoji: data.iconEmoji,
      });
      // Return a minimal member object - the query will update automatically
      return {
        _id: userId,
        clerkId: "",
        name: data.name || "",
        role: "child",
        iconEmoji: data.iconEmoji,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update member";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [updateProfileMutation]);

  return {
    updateMember,
    loading,
    error,
  };
}

export function useDeleteFamilyMember() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const removeMemberMutation = useMutation(api.families.removeMember);

  const deleteMember = useCallback(async (userId: Id<"users">): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await removeMemberMutation({ userId });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete member";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [removeMemberMutation]);

  return {
    deleteMember,
    loading,
    error,
  };
}
