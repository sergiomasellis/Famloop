"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChoreItem } from "@/types";
import { Chore } from "@/hooks/useChores";
import { FamilyMember } from "@/hooks/useFamilyMembers";
import { Check, MoreVertical, Pencil, Trash2, Undo, Repeat } from "lucide-react";

// Legacy ChoreCard for demo data (backwards compatible)
type LegacyChoreCardProps = {
  chore: ChoreItem;
  colorClass: string;
};

export function LegacyChoreCard({ chore, colorClass }: LegacyChoreCardProps) {
  return (
    <Card className={`border-2 border-black shadow-[2px_2px_0px_0px_var(--shadow-color)] ${colorClass} bg-opacity-100`}>
      <CardHeader className="border-b-2 border-black pb-3">
        <CardTitle className="text-base font-bold">
          <span className="mr-2">{chore.emoji}</span>
          {chore.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between pt-3">
        <div className="text-xs font-bold text-foreground">
          {chore.points} pts · {chore.assignedTo}
        </div>
        <div
          className={`text-xs font-bold px-2 py-0.5 rounded border-2 border-black ${
            chore.completed ? "bg-green-400 text-black" : "bg-white text-black"
          }`}
          role="status"
          aria-label={chore.completed ? "completed" : "pending"}
        >
          {chore.completed ? "Completed" : "Pending"}
        </div>
      </CardContent>
    </Card>
  );
}

// New ChoreCard for API data with actions
type ChoreCardProps = {
  chore: Chore;
  familyMembers: FamilyMember[];
  colorClass?: string;
  onEdit: (chore: Chore) => void;
  onDelete: (chore: Chore) => void;
  onToggleComplete: (chore: Chore) => void;
};

export function ChoreCard({
  chore,
  familyMembers,
  colorClass = "event-green",
  onEdit,
  onDelete,
  onToggleComplete,
}: ChoreCardProps) {
  // Find assignee(s) - support both single and multiple assignees
  const assigneeIds = chore.assignedToIds || [];
  const assignee = assigneeIds.length > 0
    ? familyMembers.find((m) => assigneeIds.includes(m._id))
    : undefined;
  const assigneeName = assignee?.name || "Unassigned";
  const assigneeEmoji = assignee?.iconEmoji || "";

  // Use completion count from the chore object (provided by Convex query)
  const completionCount = chore.completionCount ?? 0;

  // Check if max completions reached
  const maxCompletions = chore.maxCompletions ?? null;
  const isMaxReached = maxCompletions !== null && completionCount >= maxCompletions;
  const canComplete = !isMaxReached || !chore.isRecurring;

  // Wrap the toggle complete handler
  const handleToggleComplete = async (c: Chore) => {
    if (c.isRecurring && isMaxReached) {
      return; // Don't allow completion if max reached
    }
    await onToggleComplete(c);
    // Convex will automatically update the chore through reactive queries
  };

  // Determine if card should be faded (completed)
  const isFaded = chore.completed || (chore.isRecurring && isMaxReached);

  return (
    <Card
      className={`border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] ${colorClass} bg-opacity-100 transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] ${
        isFaded ? "opacity-75" : ""
      }`}
    >
      <CardHeader className="pb-2 border-b-2 border-border bg-white/50 dark:bg-black/20">
        <div className="flex items-start justify-between">
          <CardTitle
            className={`text-base font-black flex items-center gap-2 ${
              isFaded ? "line-through text-muted-foreground" : ""
            }`}
          >
            <span className="text-xl">{chore.emoji || "📋"}</span>
            {chore.title}
            {chore.isRecurring && (
              <Badge 
                variant="outline" 
                className={`ml-2 font-bold text-xs border-2 border-border ${
                  isMaxReached 
                    ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100" 
                    : "bg-blue-100 dark:bg-blue-900"
                }`}
              >
                <Repeat className="h-3 w-3 mr-1" />
                {maxCompletions !== null 
                  ? `${completionCount}/${maxCompletions}` 
                  : `${completionCount}x`
                }
              </Badge>
            )}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-1 hover:bg-transparent hover:border-2 hover:border-border">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow-color)]">
              <DropdownMenuItem 
                onClick={() => canComplete && handleToggleComplete(chore)} 
                className={`font-bold focus:bg-foreground focus:text-background ${!canComplete ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={!canComplete}
              >
                {chore.isRecurring ? (
                  isMaxReached ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      All Done!
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Complete Again
                    </>
                  )
                ) : chore.completed ? (
                  <>
                    <Undo className="mr-2 h-4 w-4" />
                    Mark Incomplete
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Mark Complete
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(chore)} className="font-bold focus:bg-foreground focus:text-background">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={() => onDelete(chore)}
                className="text-destructive font-bold focus:bg-destructive focus:text-white"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        {chore.description && (
          <p className="text-xs font-medium text-foreground/80 mb-3 line-clamp-2 border-l-2 border-border pl-2">
            {chore.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-xs font-bold bg-foreground text-background px-2 py-1 rounded-md shadow-[1px_1px_0px_0px_rgba(255,255,255,0.5)] dark:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.5)]">
              {chore.pointValue} pts
            </div>
            <div className="text-xs font-bold flex items-center gap-1 bg-white/80 dark:bg-black/40 px-2 py-1 rounded-md border border-border">
              {assigneeEmoji && <span>{assigneeEmoji}</span>}
              {assigneeName}
            </div>
          </div>
          {!chore.isRecurring && (
            <div
              className={`text-xs font-bold px-2 py-1 rounded-md border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] ${
                chore.completed
                  ? "bg-green-400 text-black"
                  : "bg-orange-400 text-black"
              }`}
              role="status"
              aria-label={chore.completed ? "completed" : "pending"}
            >
              {chore.completed ? "Done" : "Pending"}
            </div>
          )}
          {chore.isRecurring && (
            <div
              className={`text-xs font-bold px-2 py-1 rounded-md border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] flex items-center gap-1 ${
                isMaxReached 
                  ? "bg-green-400 text-black" 
                  : "bg-blue-400 text-black"
              }`}
              role="status"
              aria-label={isMaxReached ? "completed" : "recurring"}
            >
              {isMaxReached ? (
                <>
                  <Check className="h-3 w-3" />
                  All Done
                </>
              ) : (
                <>
                  <Repeat className="h-3 w-3" />
                  Recurring
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
