"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export type Family = {
  _id: Id<"families">;
  name: string;
  createdAt: number;
  adminPin?: string;
};

export function useFamily() {
  const family = useQuery(api.families.getCurrentFamily);
  const createFamilyMutation = useMutation(api.families.create);

  const loading = family === undefined;
  const error = null; // Convex handles errors via the query state

  const createFamily = async (name: string, adminPin?: string): Promise<Family | null> => {
    try {
      const familyId = await createFamilyMutation({ name, adminPin });
      // Return a minimal family object - the query will update automatically
      return {
        _id: familyId,
        name,
        createdAt: Date.now(),
      };
    } catch (err) {
      console.error("Failed to create family:", err);
      return null;
    }
  };

  return {
    family: family as Family | null,
    loading,
    error,
    createFamily,
    // refetch is not needed with Convex - it's reactive
    refetch: () => {},
  };
}
