"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Crown, Medal, Star, Zap, TrendingUp, Target, Sparkles } from "lucide-react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";

// Animated counter
function AnimatedCounter({ end, duration = 1500 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span>{count.toLocaleString()}</span>;
}

// Rank badge component
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="relative">
        <div className="w-12 h-12 bg-secondary border-2 border-border shadow-[3px_3px_0px_0px_var(--shadow-color)] rounded-xl flex items-center justify-center animate-pulse">
          <Crown className="size-7 text-secondary-foreground" />
        </div>
        <div className="absolute -top-1 -right-1 text-xl">👑</div>
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-12 h-12 bg-[var(--event-blue)]/30 border-2 border-border shadow-[3px_3px_0px_0px_var(--shadow-color)] rounded-xl flex items-center justify-center">
        <Medal className="size-7" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-12 h-12 bg-[var(--event-orange)]/30 border-2 border-border shadow-[3px_3px_0px_0px_var(--shadow-color)] rounded-xl flex items-center justify-center">
        <Medal className="size-6" />
      </div>
    );
  }
  return (
    <div className="w-12 h-12 bg-muted border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] rounded-xl flex items-center justify-center">
      <span className="text-xl font-black">{rank}</span>
    </div>
  );
}

// Stat card
function StatCard({ icon: Icon, value, label, color }: { icon: React.ElementType; value: React.ReactNode; label: string; color: string }) {
  return (
    <div className={`${color} border-2 border-border rounded-xl p-4 shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_var(--shadow-color)] transition-all`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-background/50 rounded-lg border-2 border-border">
          <Icon className="size-5" />
        </div>
        <div>
          <div className="text-2xl font-black">{value}</div>
          <div className="text-xs font-bold uppercase opacity-80">{label}</div>
        </div>
      </div>
    </div>
  );
}

function LeaderboardPageContent() {
  const { leaderboard, loading, error } = useLeaderboard();

  // Calculate stats
  const totalPoints = leaderboard.reduce((sum, entry) => sum + entry.totalPoints, 0);
  const weeklyPoints = leaderboard.reduce((sum, entry) => sum + (entry.weeklyPoints || 0), 0);
  const topScorer = leaderboard[0]?.user.name || "—";

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight flex items-center gap-3">
              <Trophy className="size-8" />
              Leaderboard
            </h1>
            <p className="text-muted-foreground mt-2 font-bold">Track your family&apos;s champions!</p>
          </div>
        </div>

        {/* Loading state */}
        <Card className="p-12 text-center border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow-color)]">
          <div className="text-6xl animate-bounce mb-4">🏆</div>
          <p className="text-lg font-black uppercase">Loading rankings...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight flex items-center gap-3">
              <Trophy className="size-8" />
              Leaderboard
            </h1>
            <p className="text-muted-foreground mt-2 font-bold">Track your family&apos;s champions!</p>
          </div>
        </div>

        {/* Error state */}
        <Card className="p-12 text-center border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow-color)] bg-destructive/10">
          <div className="text-6xl mb-4">😢</div>
          <p className="text-xl font-black uppercase text-destructive mb-2">Something went wrong</p>
          <p className="text-sm font-bold text-muted-foreground">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight flex items-center gap-3">
            <Trophy className="size-8" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground mt-2 font-bold">Track your family&apos;s champions!</p>
        </div>
        <Badge className="px-4 py-2 text-sm font-black uppercase border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] bg-secondary text-secondary-foreground">
          <Sparkles className="size-4 mr-2" />
          This Week
        </Badge>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Trophy}
          value={<AnimatedCounter end={totalPoints} />}
          label="Total Points"
          color="bg-[var(--event-purple)]/20"
        />
        <StatCard
          icon={Zap}
          value={<AnimatedCounter end={weeklyPoints} />}
          label="This Week"
          color="bg-[var(--event-green)]/20"
        />
        <StatCard
          icon={Target}
          value={leaderboard.length}
          label="Competitors"
          color="bg-[var(--event-blue)]/20"
        />
        <StatCard
          icon={Crown}
          value={topScorer}
          label="Leading"
          color="bg-secondary"
        />
      </div>

      {/* Leaderboard Card */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground border-b-2 border-border">
          <CardTitle className="leading-none flex items-center gap-3 font-black uppercase tracking-tight p-4">
            <Star className="size-6" />
            Weekly Rankings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {leaderboard.length === 0 ? (
            <div className="relative text-center py-16 overflow-hidden">
              {/* Decorative corners */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-border rounded-tl-xl" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-border rounded-tr-xl" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-border rounded-bl-xl" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-border rounded-br-xl" />

              <div className="text-6xl mb-4 animate-bounce">🎯</div>
              <h3 className="text-2xl font-black uppercase mb-2">No points yet!</h3>
              <p className="text-muted-foreground font-bold">
                Complete chores to earn points and climb the leaderboard!
              </p>
            </div>
          ) : (
            <div className="divide-y-2 divide-border">
              {leaderboard.map((entry, i) => {
                const isTop3 = i < 3;
                const bgColor = i === 0
                  ? "bg-secondary/20"
                  : i === 1
                    ? "bg-[var(--event-blue)]/10"
                    : i === 2
                      ? "bg-[var(--event-orange)]/10"
                      : "";

                return (
                  <div
                    key={entry.user._id}
                    className={`flex items-center gap-4 p-4 transition-all hover:bg-muted/50 ${bgColor}`}
                  >
                    {/* Rank */}
                    <RankBadge rank={i + 1} />

                    {/* User info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="size-12 border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)]">
                        <AvatarImage src={entry.user.profileImageUrl} alt={entry.user.name} />
                        <AvatarFallback className="text-lg font-black bg-primary text-primary-foreground">
                          {entry.user.iconEmoji || entry.user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-black text-lg truncate flex items-center gap-2">
                          {entry.user.name}
                          {i === 0 && <span className="text-xl">🔥</span>}
                        </div>
                        <div className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${entry.user.role === 'parent' ? 'bg-primary' : 'bg-accent'}`} />
                          {entry.user.role}
                        </div>
                      </div>
                    </div>

                    {/* Points */}
                    <div className="flex items-center gap-3">
                      {entry.weeklyPoints !== undefined && entry.weeklyPoints > 0 && (
                        <div className="text-sm font-bold text-accent flex items-center gap-1 px-2 py-1 bg-accent/10 rounded-lg border border-border">
                          <TrendingUp className="size-3" />
                          +{entry.weeklyPoints}
                        </div>
                      )}
                      <div className={`text-lg font-black px-4 py-2 rounded-xl border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] ${isTop3 ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                        {entry.totalPoints} pts
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Motivational footer */}
      {leaderboard.length > 0 && (
        <div className="text-center py-6">
          <p className="text-muted-foreground font-bold text-lg">
            {leaderboard.length > 1
              ? `${leaderboard[0].user.name} is leading! Can anyone catch up? 🏃‍♂️`
              : "Complete more chores to climb the rankings! 💪"
            }
          </p>
        </div>
      )}
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
