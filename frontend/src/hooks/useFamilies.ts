"use client";

import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export type Family = {
  _id: Id<"families">;
  name: string;
  createdAt: number;
};

export type FamilyCreate = {
  name: string;
  adminPin?: string; // 4-6 digit PIN
};

export type FamilyUpdate = {
  name?: string;
  adminPin?: string; // 4-6 digit PIN
};

export function useFamilies() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFamilyMutation = useMutation(api.families.create);
  const updateFamilyMutation = useMutation(api.families.update);

  const createFamily = useCallback(
    async (data: FamilyCreate): Promise<Family | null> => {
      setLoading(true);
      setError(null);
      try {
        const familyId = await createFamilyMutation({
          name: data.name,
          adminPin: data.adminPin,
        });
        return {
          _id: familyId,
          name: data.name,
          createdAt: Date.now(),
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [createFamilyMutation]
  );

  const updateFamily = useCallback(
    async (familyId: Id<"families">, data: FamilyUpdate): Promise<Family | null> => {
      setLoading(true);
      setError(null);
      try {
        await updateFamilyMutation({
          id: familyId,
          name: data.name,
          adminPin: data.adminPin,
        });
        return {
          _id: familyId,
          name: data.name || "",
          createdAt: Date.now(),
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [updateFamilyMutation]
  );

  const deleteFamily = useCallback(async (familyId: Id<"families">): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      // Note: Delete family would need to be implemented in Convex if needed
      console.warn("Delete family not implemented in Convex");
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createFamily,
    updateFamily,
    deleteFamily,
  };
}
