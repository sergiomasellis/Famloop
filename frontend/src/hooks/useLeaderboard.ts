"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export type LeaderboardEntry = {
  user: {
    _id: Id<"users">;
    name: string;
    iconEmoji?: string;
    profileImageUrl?: string;
    role: "parent" | "child";
  };
  totalPoints: number;
  weeklyPoints?: number;
};

export function useLeaderboard(weekStart?: number) {
  // Use weekly leaderboard if weekStart provided, otherwise total leaderboard
  const totalLeaderboard = useQuery(api.points.getCurrentFamilyLeaderboard);
  const weeklyLeaderboard = useQuery(
    api.points.getCurrentFamilyWeeklyLeaderboard,
    weekStart ? { weekStart } : "skip"
  );

  const leaderboard = useMemo(() => {
    const data = weekStart ? weeklyLeaderboard : totalLeaderboard;
    if (!data) return [];

    return data.map((entry) => ({
      user: entry.user as LeaderboardEntry["user"],
      totalPoints: "totalPoints" in entry ? entry.totalPoints : 0,
      weeklyPoints: "weeklyPoints" in entry ? entry.weeklyPoints : undefined,
    }));
  }, [totalLeaderboard, weeklyLeaderboard, weekStart]);

  const loading =
    (weekStart ? weeklyLeaderboard : totalLeaderboard) === undefined;

  return {
    leaderboard,
    loading,
    error: null,
    refetch: () => {}, // Not needed with Convex - it's reactive
  };
}
