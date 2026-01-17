"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Sparkles,
  Clock,
  AlertCircle,
  CheckCircle2,
  Star,
  Target,
  PartyPopper,
  Zap,
  Repeat,
  Filter
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ChoreDialog } from "@/features/chores/components/ChoreDialog";
import { useChores, Chore, ChoreCreate, ChoreUpdate } from "@/hooks/useChores";
import { useFamilyMembers, FamilyMember } from "@/hooks/useFamilyMembers";
import { useFamily } from "@/hooks/useFamily";
import { Id } from "../../../convex/_generated/dataModel";
import { differenceInDays, addDays, startOfWeek } from "date-fns";

// Color schemes for family members - Neo-Brutalist solid colors
const MEMBER_COLORS = [
  { bg: "bg-[var(--event-purple)]", light: "bg-[var(--event-purple)]/10", text: "text-foreground", border: "border-border", accent: "purple" },
  { bg: "bg-[var(--event-blue)]", light: "bg-[var(--event-blue)]/10", text: "text-foreground", border: "border-border", accent: "blue" },
  { bg: "bg-[var(--event-green)]", light: "bg-[var(--event-green)]/10", text: "text-foreground", border: "border-border", accent: "green" },
  { bg: "bg-primary", light: "bg-primary/10", text: "text-foreground", border: "border-border", accent: "primary" },
  { bg: "bg-[var(--event-orange)]", light: "bg-[var(--event-orange)]/10", text: "text-foreground", border: "border-border", accent: "orange" },
  { bg: "bg-accent", light: "bg-accent/10", text: "text-foreground", border: "border-border", accent: "accent" },
];

// Confetti component
function Confetti({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-20px`,
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        >
          <div
            className="w-3 h-3 border-2 border-border"
            style={{
              backgroundColor: [
                'var(--event-purple)',
                'var(--event-blue)', 
                'var(--event-green)', 
                'var(--event-orange)',
                'oklch(0.6 0.2 270)', // primary
                'oklch(0.6 0.2 20)'  // destructive
              ][Math.floor(Math.random() * 6)],
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

// Progress ring
function ProgressRing({ progress, size = 100 }: { progress: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="none" className="text-muted/20" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="url(#progressGradient)" strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-700" />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="oklch(0.6 0.2 270)" />
            <stop offset="100%" stopColor="oklch(0.7 0.2 150)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

// Chore card component
function ChoreCard({
  chore,
  familyMembers,
  colorScheme,
  onToggleComplete,
  onEdit,
  onDelete,
  daysRemaining,
}: {
  chore: Chore;
  familyMembers: FamilyMember[];
  colorScheme: typeof MEMBER_COLORS[0];
  onToggleComplete: (chore: Chore) => void;
  onEdit: (chore: Chore) => void;
  onDelete: (chore: Chore) => void;
  daysRemaining: number | null;
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  // Get all assignees from assignedToIds array
  const getAssignees = (): FamilyMember[] => {
    if (chore.assignedToIds && chore.assignedToIds.length > 0) {
      return familyMembers.filter((m) => chore.assignedToIds?.includes(m._id));
    }
    return [];
  };
  const assignees = getAssignees();

  // For individual chores, get who has completed
  const completedByIds = chore.completedByIds || [];
  const isIndividualChore = chore.isGroupChore === false && assignees.length > 1;
  const individualProgress = isIndividualChore
    ? { done: completedByIds.length, total: assignees.length }
    : null;

  const handleComplete = () => {
    // For individual chores, only animate if not already completed by current user
    if (isIndividualChore || !chore.completed) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }
    onToggleComplete(chore);
  };

  const getUrgencyBadge = () => {
    if (chore.completed) return null;
    if (daysRemaining === null) return null;
    
    if (daysRemaining < 0) {
      return <Badge className="bg-destructive text-destructive-foreground text-xs border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] uppercase font-black"><AlertCircle className="mr-1 h-3 w-3" />Overdue</Badge>;
    } else if (daysRemaining === 0) {
      return <Badge className="bg-secondary text-secondary-foreground text-xs animate-pulse border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] uppercase font-black"><Zap className="mr-1 h-3 w-3" />Due Today</Badge>;
    } else if (daysRemaining <= 2) {
      return <Badge className="bg-card text-foreground text-xs border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] uppercase font-black"><Clock className="mr-1 h-3 w-3" />{daysRemaining}d left</Badge>;
    }
    return null;
  };

  return (
    <Card className={`group relative overflow-hidden border-2 border-border rounded-xl shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] ${chore.completed ? 'opacity-60' : ''} ${isAnimating ? 'scale-[1.02]' : ''}`}>
      {/* Top accent */}
      <div className={`h-2 ${colorScheme.bg} border-b-2 border-border`} />
      
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`text-3xl transition-transform ${isAnimating ? 'animate-bounce' : ''} ${chore.completed ? 'grayscale' : ''}`}>
            {chore.emoji || "📋"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-semibold ${chore.completed ? 'line-through text-muted-foreground' : ''}`}>
                {chore.title}
              </h3>
              {chore.isRecurring && (
                <Badge className="text-xs gap-1 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] uppercase font-black">
                  <Repeat className="h-3 w-3" />
                  Recurring
                </Badge>
              )}
            </div>
            {chore.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{chore.description}</p>
            )}
            {chore.isRecurring && chore.recurrenceType && (
              <p className="text-xs text-muted-foreground mt-1">
                {chore.recurrenceType === "daily" && `${chore.recurrenceCount || 1}x daily`}
                {chore.recurrenceType === "weekly" && `Every ${chore.recurrenceCount || 1} week${(chore.recurrenceCount || 1) > 1 ? 's' : ''}`}
                {chore.recurrenceType === "monthly" && `Every ${chore.recurrenceCount || 1} month${(chore.recurrenceCount || 1) > 1 ? 's' : ''}`}
              </p>
            )}
          </div>
          {getUrgencyBadge()}
        </div>

        {/* Info row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-black uppercase ${colorScheme.light} border-2 ${colorScheme.border} shadow-[2px_2px_0px_0px_var(--shadow-color)]`}>
            <Star className="h-3 w-3" />
            {chore.pointValue} pts
          </div>
          {assignees.length === 0 ? (
            <span className="text-xs text-muted-foreground">👤 Anyone</span>
          ) : assignees.length === 1 ? (
            <span className="text-xs font-bold text-muted-foreground">
              {assignees[0].iconEmoji} {assignees[0].name}
            </span>
          ) : isIndividualChore ? (
            <Badge className="text-xs bg-primary/10 text-foreground border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] uppercase font-black">
              Individual ({individualProgress?.done}/{individualProgress?.total})
            </Badge>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">
                {assignees.map((a) => a.iconEmoji || "👤").join("")}
              </span>
              <span className="text-xs text-muted-foreground">
                Group chore
              </span>
            </div>
          )}
        </div>

        {/* Individual chore progress - show who completed */}
        {isIndividualChore && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {assignees.map((assignee) => {
              const hasCompleted = completedByIds.includes(assignee._id);
              return (
                <div
                  key={assignee._id}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] ${
                    hasCompleted
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {hasCompleted && <CheckCircle2 className="h-3 w-3" />}
                  {assignee.iconEmoji || "👤"} {assignee.name}
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleComplete}
            size="sm"
            className={`flex-1 font-bold uppercase border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all ${
              chore.completed 
                ? 'bg-muted text-muted-foreground' 
                : `${colorScheme.bg} text-foreground`
            }`}
          >
            {chore.completed ? (
              <><CheckCircle2 className="mr-1.5 h-4 w-4" />Done!</>
            ) : isIndividualChore ? (
              <><Target className="mr-1.5 h-4 w-4" />Mark Done</>
            ) : (
              <><Target className="mr-1.5 h-4 w-4" />Complete</>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onEdit(chore)} 
            className="px-3 border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-all"
          >
            ✏️
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onDelete(chore)} 
            className="px-3 border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:bg-destructive hover:text-destructive-foreground hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-all"
          >
            🗑️
          </Button>
        </div>
      </CardContent>

      {/* Sparkle effect */}
      {isAnimating && (
        <div className="absolute inset-0 pointer-events-none">
          <Sparkles className="absolute top-3 right-3 h-5 w-5 text-yellow-400 animate-ping" />
          <Sparkles className="absolute bottom-3 left-3 h-4 w-4 text-pink-400 animate-ping" style={{ animationDelay: '0.1s' }} />
        </div>
      )}
    </Card>
  );
}

// Member section
function MemberSection({
  member,
  chores,
  familyMembers,
  colorScheme,
  onToggleComplete,
  onEdit,
  onDelete,
  getDaysRemaining,
}: {
  member: FamilyMember | null;
  chores: Chore[];
  familyMembers: FamilyMember[];
  colorScheme: typeof MEMBER_COLORS[0];
  onToggleComplete: (chore: Chore) => void;
  onEdit: (chore: Chore) => void;
  onDelete: (chore: Chore) => void;
  getDaysRemaining: (weekStart: number) => number | null;
}) {
  const completedCount = chores.filter(c => c.completed).length;
  const totalCount = chores.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const totalPoints = chores.filter(c => c.completed).reduce((sum, c) => sum + c.pointValue, 0);

  return (
    <div className="mb-8">
      {/* Member header */}
      <div className="rounded-xl border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow-color)] mb-4 overflow-hidden">
        <div className={`${colorScheme.bg} border-b-2 border-border p-4`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{member?.iconEmoji || "📋"}</span>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">{member?.name || "Unassigned"}</h2>
                <p className="text-sm font-bold opacity-80">
                  {completedCount}/{totalCount} done
                  {totalPoints > 0 && <span className="ml-2">• {totalPoints} pts earned</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 h-4 bg-background border-2 border-border rounded-md overflow-hidden shadow-[2px_2px_0px_0px_var(--shadow-color)]">
                <div className="h-full bg-foreground transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-sm font-black w-12 bg-background px-2 py-1 rounded-md border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)]">{Math.round(progress)}%</span>
              {progress === 100 && <span className="text-xl">🎉</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Chores grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {chores.map((chore) => (
          <ChoreCard
            key={chore._id}
            chore={chore}
            familyMembers={familyMembers}
            colorScheme={colorScheme}
            onToggleComplete={onToggleComplete}
            onEdit={onEdit}
            onDelete={onDelete}
            daysRemaining={getDaysRemaining(chore.weekStart)}
          />
        ))}
      </div>
    </div>
  );
}

function ChoresDashboardContent() {
  const { family } = useFamily();
  const FAMILY_ID = family?._id;

  // Get current week start timestamp
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 0 }).getTime();

  const { chores, loading, error, refetch, createChore, updateChore, deleteChore, toggleComplete } = useChores(currentWeekStart);
  const { members: familyMembers } = useFamilyMembers(FAMILY_ID);

  const [choreDialogOpen, setChoreDialogOpen] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  const [selectedMember, setSelectedMember] = useState<string | "all">("all");

  const getDaysRemaining = (weekStart: number): number | null => {
    const weekStartDate = new Date(weekStart);
    const weekEndDate = addDays(weekStartDate, 6);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return differenceInDays(weekEndDate, today);
  };

  // Helper to get assignee IDs from a chore
  const getChoreAssigneeIds = (chore: Chore): Id<"users">[] => {
    return chore.assignedToIds || [];
  };

  const filteredChores = useMemo(() => {
    let filtered = chores;
    if (!showCompleted) filtered = filtered.filter((c) => !c.completed);
    if (selectedMember !== "all") {
      filtered = filtered.filter((c) => {
        const assigneeIds = getChoreAssigneeIds(c);
        return assigneeIds.includes(selectedMember as Id<"users">);
      });
    }
    return filtered;
  }, [chores, showCompleted, selectedMember]);

  const choresByAssignee = useMemo(() => {
    const grouped: Record<string, Chore[]> = { unassigned: [] };
    familyMembers.forEach((m) => { grouped[m._id] = []; });

    filteredChores.forEach((chore) => {
      const assigneeIds = getChoreAssigneeIds(chore);

      if (assigneeIds.length === 0) {
        // No assignees - goes to unassigned
        grouped.unassigned.push(chore);
      } else {
        // Add to each assignee's group (chore appears under multiple people)
        assigneeIds.forEach((id) => {
          if (grouped[id]) {
            grouped[id].push(chore);
          }
        });
      }
    });
    return grouped;
  }, [filteredChores, familyMembers]);

  const stats = useMemo(() => {
    const total = chores.length;
    const completed = chores.filter((c) => c.completed).length;
    const totalPoints = chores.filter((c) => c.completed).reduce((sum, c) => sum + c.pointValue, 0);
    const progress = total > 0 ? (completed / total) * 100 : 0;
    return { total, completed, totalPoints, progress };
  }, [chores]);

  const handleCreateChore = () => { setEditingChore(null); setChoreDialogOpen(true); };
  const handleEditChore = (chore: Chore) => { setEditingChore(chore); setChoreDialogOpen(true); };
  const handleDeleteChore = async (chore: Chore) => { if (confirm(`Delete "${chore.title}"?`)) { await deleteChore(chore._id); refetch(); } };
  const handleSaveChore = async (data: ChoreCreate | ChoreUpdate, choreId?: Id<"chores">) => {
    if (choreId !== undefined) await updateChore(choreId, data as ChoreUpdate);
    else await createChore(data as ChoreCreate);
    refetch();
  };
  const handleToggleComplete = async (chore: Chore) => {
    if (!chore.completed) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 2000); }
    await toggleComplete(chore._id);
    refetch();
  };

  const getMemberColor = (_: string | null, index: number) => MEMBER_COLORS[index % MEMBER_COLORS.length];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="p-12 text-center border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow-color)]">
          <div className="text-6xl animate-bounce mb-4">🧹</div>
          <p className="text-lg font-black uppercase">Loading chores...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="p-12 text-center border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow-color)] bg-destructive/10">
          <div className="text-6xl mb-4">😢</div>
          <p className="text-xl font-black uppercase text-destructive mb-2">Something went wrong</p>
          <p className="text-sm font-bold text-muted-foreground">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Confetti show={showConfetti} />
      
      <div className="container mx-auto max-w-7xl py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight flex items-center gap-3">
              <Sparkles className="h-8 w-8" />
              Chore Quest
            </h1>
            <p className="text-muted-foreground mt-2 font-bold">Complete chores, earn points, become a champion!</p>
          </div>
          <Button 
            onClick={handleCreateChore} 
            size="lg" 
            className="bg-primary text-primary-foreground font-black uppercase border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all gap-2"
          >
            <Plus className="h-5 w-5" />
            New Chore
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_var(--shadow-color)] transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">Progress</p>
                <p className="text-3xl font-black">{Math.round(stats.progress)}%</p>
              </div>
              <ProgressRing progress={stats.progress} size={56} />
            </div>
          </Card>
          <Card className="p-4 border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_var(--shadow-color)] transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-[var(--event-blue)]/20 border-2 border-border">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">Total</p>
                <p className="text-3xl font-black">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_var(--shadow-color)] transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-accent/20 border-2 border-border">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">Done</p>
                <p className="text-3xl font-black">{stats.completed}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-secondary text-secondary-foreground border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_var(--shadow-color)] transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-foreground/20 border-2 border-border">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase opacity-80">Points</p>
                <p className="text-3xl font-black">{stats.totalPoints}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-black uppercase text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Filter:</span>
          </div>
          <Button
            variant={showCompleted ? "default" : "outline"}
            size="sm"
            onClick={() => setShowCompleted(!showCompleted)}
            className="rounded-md border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_var(--shadow-color)] transition-all font-bold uppercase"
          >
            {showCompleted ? "All chores" : "Active only"}
          </Button>
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="h-9 px-3 rounded-md border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] text-sm font-bold bg-card focus:outline-none focus:ring-0 focus:border-border"
          >
            <option value="all">👥 Everyone</option>
            {familyMembers.map((m) => (
              <option key={m._id} value={m._id}>{m.iconEmoji || "👤"} {m.name}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        {filteredChores.length === 0 ? (
          <div className="relative">
            <Card className="py-20 text-center border-2 border-border shadow-[8px_8px_0px_0px_var(--shadow-color)] overflow-hidden bg-gradient-to-br from-background to-muted/20">
              {/* Decorative corners */}
              <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-border rounded-tl-xl" />
              <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-border rounded-tr-xl" />
              <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-border rounded-bl-xl" />
              <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-border rounded-br-xl" />
              
              <div className="relative z-10 max-w-md mx-auto px-4">
                <div className="text-8xl mb-6 animate-bounce inline-block">
                  {chores.length === 0 ? "🎯" : "🎉"}
                </div>
                
                <div className="mb-6">
                  <h3 className="text-4xl font-black uppercase mb-3 tracking-tight">
                    {chores.length === 0 ? "No chores yet!" : "All caught up!"}
                  </h3>
                  <div className="inline-block px-4 py-2 bg-secondary text-secondary-foreground border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow-color)] rounded-xl mb-4">
                    <p className="text-sm font-black uppercase">
                      {chores.length === 0 ? "Ready to get started?" : "You're crushing it!"}
                    </p>
                  </div>
                  <p className="text-muted-foreground font-bold text-lg">
                    {chores.length === 0 
                      ? "Create your first chore and start earning points!" 
                      : "Great job completing all your tasks!"}
                  </p>
                </div>
                
                {chores.length === 0 && (
                  <Button 
                    onClick={handleCreateChore}
                    size="lg"
                    className="font-black uppercase text-lg px-8 py-6 h-auto border-2 border-border bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                  >
                    <Plus className="mr-2 h-6 w-6" />
                    Create Chore
                  </Button>
                )}
              </div>
              
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute top-10 left-10 text-6xl">✨</div>
                <div className="absolute top-20 right-20 text-6xl">⭐</div>
                <div className="absolute bottom-20 left-20 text-6xl">🏆</div>
                <div className="absolute bottom-10 right-10 text-6xl">💪</div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {choresByAssignee.unassigned.length > 0 && (
              <MemberSection
                member={null}
                chores={choresByAssignee.unassigned}
                familyMembers={familyMembers}
                colorScheme={MEMBER_COLORS[5]}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEditChore}
                onDelete={handleDeleteChore}
                getDaysRemaining={getDaysRemaining}
              />
            )}
            {familyMembers.map((member, index) => {
              const memberChores = choresByAssignee[member._id] || [];
              if (memberChores.length === 0) return null;
              return (
                <MemberSection
                  key={member._id}
                  member={member}
                  chores={memberChores}
                  familyMembers={familyMembers}
                  colorScheme={getMemberColor(member._id, index)}
                  onToggleComplete={handleToggleComplete}
                  onEdit={handleEditChore}
                  onDelete={handleDeleteChore}
                  getDaysRemaining={getDaysRemaining}
                />
              );
            })}
          </div>
        )}

        {/* All complete toast */}
        {stats.total > 0 && stats.completed === stats.total && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-bounce">
            <Card className="px-6 py-4 bg-accent text-accent-foreground border-2 border-border shadow-[8px_8px_0px_0px_var(--shadow-color)] flex items-center gap-3">
              <PartyPopper className="h-6 w-6" />
              <div>
                <p className="font-black uppercase">All done!</p>
                <p className="text-sm font-bold opacity-80">You&apos;re a chore champion! 🏆</p>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Dialog */}
      {FAMILY_ID && (
        <ChoreDialog
          open={choreDialogOpen}
          onOpenChange={setChoreDialogOpen}
          chore={editingChore}
          familyMembers={familyMembers}
          familyId={FAMILY_ID}
          onSave={handleSaveChore}
        />
      )}
    </div>
  );
}

export default function ChoresDashboardPage() {
  return (
    <ProtectedRoute>
      <ChoresDashboardContent />
    </ProtectedRoute>
  );
}
