"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function LeaderboardPageContent() {
  const { leaderboard, loading, error } = useLeaderboard();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="size-5" />
          <h1 className="text-xl font-semibold tracking-tight">Leaderboard</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">Loading leaderboard...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="size-5" />
          <h1 className="text-xl font-semibold tracking-tight">Leaderboard</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-destructive">Error: {error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="size-5" />
        <h1 className="text-xl font-semibold tracking-tight">Leaderboard</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>This Week</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {leaderboard.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No points yet. Complete chores to earn points!
            </div>
          ) : (
            leaderboard.map((entry, i) => {
              const rankBgColor =
                i === 0
                  ? "bg-yellow-400 border-yellow-600"
                  : i === 1
                    ? "bg-gray-300 border-gray-500"
                    : i === 2
                      ? "bg-amber-600 border-amber-800"
                      : "bg-secondary border-border";

              return (
                <div
                  key={entry.user._id}
                  className="rounded-md border-2 border-border bg-card shadow-[2px_2px_0px_0px_var(--shadow-color)] overflow-hidden hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_var(--shadow-color)] transition-all"
                >
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`size-8 rounded-full text-foreground border-2 grid place-items-center font-bold shadow-[2px_2px_0px_0px_var(--shadow-color)] shrink-0 ${rankBgColor}`}
                      >
                        {i + 1}
                      </div>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-8 border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)]">
                          <AvatarImage src={entry.user.profileImageUrl} alt={entry.user.name} />
                          <AvatarFallback className="text-sm font-bold">
                            {entry.user.iconEmoji || entry.user.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-lg">{entry.user.name}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {entry.user.role}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold bg-primary text-primary-foreground px-2 py-1 rounded border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)]">
                        {entry.totalPoints} pts
                      </div>
                      {entry.weeklyPoints !== undefined && (
                        <div className="text-xs text-muted-foreground">
                          +{entry.weeklyPoints} this week
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <ProtectedRoute>
      <LeaderboardPageContent />
    </ProtectedRoute>
  );
}