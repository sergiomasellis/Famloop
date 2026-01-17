"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Chore type matching Convex schema
export type Chore = {
  _id: Id<"chores">;
  familyId: Id<"families">;
  title: string;
  description?: string;
  emoji?: string;
  pointValue: number;
  assignedToIds?: Id<"users">[];
  isGroupChore: boolean;
  completed: boolean;
  completedByIds?: Id<"users">[];
  weekStart: number;
  isRecurring: boolean;
  recurrenceType?: "daily" | "weekly" | "monthly";
  recurrenceCount?: number;
  daysOfWeek?: number[];
  maxCompletions?: number;
  createdAt: number;
  // Extended from query
  completions?: Array<{
    _id: Id<"choreCompletions">;
    userId: Id<"users">;
    completedAt: number;
    pointsAwarded: number;
    user?: { _id: Id<"users">; name: string } | null;
  }>;
  assignedTo?: Array<{ _id: Id<"users">; name: string } | null>;
  completionCount?: number;
};

export type ChoreCreate = {
  title: string;
  description?: string;
  emoji?: string;
  pointValue: number;
  assignedToIds?: Id<"users">[];
  isGroupChore?: boolean;
  weekStart: number;
  isRecurring?: boolean;
  recurrenceType?: "daily" | "weekly" | "monthly";
  recurrenceCount?: number;
  daysOfWeek?: number[];
  maxCompletions?: number;
};

export type ChoreUpdate = Partial<Omit<ChoreCreate, "weekStart">>;

export function useChores(weekStart?: number) {
  const [error, setError] = useState<string | null>(null);

  // Query chores from Convex - reactive and real-time!
  const convexChores = useQuery(
    api.chores.getCurrentFamilyChores,
    weekStart ? { weekStart } : "skip"
  );

  // Mutations
  const createChoreMutation = useMutation(api.chores.create);
  const updateChoreMutation = useMutation(api.chores.update);
  const deleteChoreMutation = useMutation(api.chores.remove);
  const completeChoreMutation = useMutation(api.chores.complete);
  const uncompleteChoreMutation = useMutation(api.chores.uncomplete);

  const chores = useMemo(() => {
    if (!convexChores) return [];
    return convexChores as Chore[];
  }, [convexChores]);

  const loading = convexChores === undefined;

  const createChore = useCallback(
    async (chore: ChoreCreate): Promise<Chore | null> => {
      try {
        setError(null);
        const choreId = await createChoreMutation({
          title: chore.title,
          description: chore.description,
          emoji: chore.emoji,
          pointValue: chore.pointValue,
          assignedToIds: chore.assignedToIds,
          isGroupChore: chore.isGroupChore,
          weekStart: chore.weekStart,
          isRecurring: chore.isRecurring,
          recurrenceType: chore.recurrenceType,
          recurrenceCount: chore.recurrenceCount,
          daysOfWeek: chore.daysOfWeek,
          maxCompletions: chore.maxCompletions,
        });

        return {
          _id: choreId,
          familyId: "" as Id<"families">, // Will be filled by reactive update
          title: chore.title,
          description: chore.description,
          emoji: chore.emoji,
          pointValue: chore.pointValue,
          assignedToIds: chore.assignedToIds,
          isGroupChore: chore.isGroupChore ?? false,
          completed: false,
          weekStart: chore.weekStart,
          isRecurring: chore.isRecurring ?? false,
          recurrenceType: chore.recurrenceType,
          recurrenceCount: chore.recurrenceCount,
          daysOfWeek: chore.daysOfWeek,
          maxCompletions: chore.maxCompletions,
          createdAt: Date.now(),
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      }
    },
    [createChoreMutation]
  );

  const updateChore = useCallback(
    async (id: Id<"chores">, updates: ChoreUpdate): Promise<Chore | null> => {
      try {
        setError(null);
        await updateChoreMutation({
          id,
          title: updates.title,
          description: updates.description,
          emoji: updates.emoji,
          pointValue: updates.pointValue,
          assignedToIds: updates.assignedToIds,
          isGroupChore: updates.isGroupChore,
          isRecurring: updates.isRecurring,
          recurrenceType: updates.recurrenceType,
          recurrenceCount: updates.recurrenceCount,
          daysOfWeek: updates.daysOfWeek,
          maxCompletions: updates.maxCompletions,
        });

        const existingChore = chores.find((c) => c._id === id);
        if (existingChore) {
          return { ...existingChore, ...updates } as Chore;
        }
        return null;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      }
    },
    [updateChoreMutation, chores]
  );

  const deleteChore = useCallback(
    async (id: Id<"chores">): Promise<boolean> => {
      try {
        setError(null);
        await deleteChoreMutation({ id });
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return false;
      }
    },
    [deleteChoreMutation]
  );

  const completeChore = useCallback(
    async (id: Id<"chores">): Promise<Chore | null> => {
      try {
        setError(null);
        await completeChoreMutation({ choreId: id });
        const existingChore = chores.find((c) => c._id === id);
        return existingChore || null;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      }
    },
    [completeChoreMutation, chores]
  );

  const toggleComplete = useCallback(
    async (id: Id<"chores">): Promise<Chore | null> => {
      const chore = chores.find((c) => c._id === id);
      if (!chore) return null;

      try {
        setError(null);
        if (!chore.completed) {
          await completeChoreMutation({ choreId: id });
        } else {
          await uncompleteChoreMutation({ choreId: id });
        }
        return chore;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      }
    },
    [chores, completeChoreMutation, uncompleteChoreMutation]
  );

  return {
    chores,
    loading,
    error,
    refetch: () => {}, // Not needed with Convex - it's reactive
    createChore,
    updateChore,
    deleteChore,
    completeChore,
    toggleComplete,
  };
}
