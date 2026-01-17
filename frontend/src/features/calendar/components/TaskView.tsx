"use client";

import { format } from "date-fns";
import { EventItem } from "@/types";
import { Chore } from "@/hooks/useChores";
import { FamilyMember } from "@/hooks/useFamilyMembers";
import { isChoreOnDay } from "@/lib/chore-utils";
import { CheckCircle2, CalendarDays, ListTodo } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type TaskViewProps = {
  days: { date: Date; key: number }[];
  events: EventItem[];
  chores: Chore[];
  familyMembers: FamilyMember[];
  onEventClick: (event: EventItem) => void;
  onChoreClick: (chore: Chore) => void;
  onToggleChore?: (chore: Chore) => void;
};

export function TaskView({
  days,
  events,
  chores,
  familyMembers,
  onEventClick,
  onChoreClick,
  onToggleChore,
}: TaskViewProps) {
  // Helper to get items for a day
  const getItemsForDay = (date: Date) => {
    // Filter chores
    const dayChores = chores.filter((chore) => isChoreOnDay(chore, date));

    // Filter events
    const dayEvents = events.filter((e) => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      return (
        (e.start >= dayStart && e.start <= dayEnd) || // Starts today
        (e.end >= dayStart && e.end <= dayEnd) || // Ends today
        (e.start < dayStart && e.end > dayEnd) // Spans today
      );
    }).sort((a, b) => a.start.getTime() - b.start.getTime());

    return { dayChores, dayEvents };
  };

  return (
    <div className="space-y-6">
      {days.map(({ date, key }) => {
        const { dayChores, dayEvents } = getItemsForDay(date);
        const isToday = new Date().toDateString() === date.toDateString();

        if (dayChores.length === 0 && dayEvents.length === 0) {
            return null; 
        }

        return (
          <div 
            key={key} 
            className={`rounded-xl border-2 border-border bg-card shadow-[4px_4px_0px_0px_var(--shadow-color)] overflow-hidden transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_var(--shadow-color)] ${
              isToday ? "ring-2 ring-primary ring-offset-2" : ""
            }`}
          >
            <div className={`px-4 py-3 border-b-2 border-border flex items-center justify-between ${isToday ? "bg-primary/10" : "bg-muted"}`}>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-card border-2 border-border text-center shadow-[2px_2px_0px_0px_var(--shadow-color)]">
                    <span className="text-[10px] font-black uppercase text-muted-foreground leading-none mb-1">{format(date, "MMM")}</span>
                    <span className="text-2xl font-black leading-none">{format(date, "d")}</span>
                </div>
                <div>
                    <h3 className={`text-lg font-black uppercase tracking-tight ${isToday ? "text-primary" : "text-foreground"}`}>
                        {format(date, "EEEE")}
                        {isToday && <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full normal-case font-bold align-middle">Today</span>}
                    </h3>
                    <p className="text-xs font-bold text-muted-foreground mt-1">
                        {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''} • {dayChores.length} chore{dayChores.length !== 1 ? 's' : ''}
                    </p>
                </div>
              </div>
            </div>

            <div className="p-4 grid gap-6 sm:grid-cols-2">
                {/* Events Column */}
                <div className="space-y-3">
                    <div className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-2 border-b-2 border-border/10 pb-2">
                        <CalendarDays className="size-4" /> Events
                    </div>
                    {dayEvents.length === 0 ? (
                        <div className="text-sm text-muted-foreground italic px-2 py-4 text-center bg-muted/30 rounded-lg border-2 border-transparent border-dashed">No events</div>
                    ) : (
                        <div className="space-y-3">
                            {dayEvents.map((event) => (
                                <div 
                                    key={event.id}
                                    onClick={() => onEventClick(event)}
                                    className="group flex items-start gap-3 p-3 rounded-lg border-2 border-border bg-card shadow-[2px_2px_0px_0px_var(--shadow-color)] cursor-pointer transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[2px_2px_0px_0px_var(--shadow-color)]"
                                >
                                    <div className="mt-0.5 text-xl bg-muted w-8 h-8 flex items-center justify-center rounded-md border-2 border-border shadow-[1px_1px_0px_0px_var(--shadow-color)]">{event.emoji}</div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-bold text-sm truncate group-hover:text-primary transition-colors">{event.title}</div>
                                        <div className="text-xs font-medium text-muted-foreground mt-0.5">
                                            {format(event.start, "h:mm a")} - {format(event.end, "h:mm a")}
                                        </div>
                                        {event.description && (
                                            <div className="text-xs text-muted-foreground truncate mt-1 opacity-80">{event.description}</div>
                                        )}
                                    </div>
                                    <div className="flex -space-x-2 pl-2">
                                        {(event.participants || []).slice(0, 3).map((p, i) => (
                                            <div key={i} className="w-6 h-6 rounded-full bg-muted border-2 border-border flex items-center justify-center text-[8px] font-bold overflow-hidden" title={p.name}>
                                                {p.name.charAt(0)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Chores Column */}
                <div className="space-y-3">
                    <div className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-2 border-b-2 border-border/10 pb-2">
                         <ListTodo className="size-4" /> Chores
                    </div>
                    {dayChores.length === 0 ? (
                        <div className="text-sm text-muted-foreground italic px-2 py-4 text-center bg-muted/30 rounded-lg border-2 border-transparent border-dashed">No chores</div>
                    ) : (
                        <div className="space-y-3">
                            {dayChores.map((chore) => {
                                const isCompleted = chore.completed;
                                // Get first assignee from assignedToIds array
                                const assigneeId = chore.assignedToIds?.[0];
                                const assignee = assigneeId ? familyMembers.find((m) => m._id === assigneeId) : undefined;
                                return (
                                <div
                                    key={chore._id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] transition-all group ${
                                        isCompleted
                                        ? "bg-muted/50 grayscale opacity-75 hover:translate-x-0 hover:translate-y-0 hover:shadow-[2px_2px_0px_0px_var(--shadow-color)]"
                                        : "bg-card hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_var(--shadow-color)]"
                                    }`}
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleChore?.(chore);
                                        }}
                                        className={`shrink-0 rounded-full w-6 h-6 border-2 border-border flex items-center justify-center transition-all shadow-[1px_1px_0px_0px_var(--shadow-color)] ${
                                            isCompleted
                                            ? "bg-muted text-muted-foreground shadow-none translate-x-[1px] translate-y-[1px]"
                                            : "bg-card hover:bg-primary/10 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
                                        }`}
                                    >
                                        {isCompleted && <CheckCircle2 className="size-4" />}
                                    </button>

                                    <div
                                        className="flex-1 min-w-0 cursor-pointer"
                                        onClick={() => onChoreClick(chore)}
                                    >
                                        <div className={`flex items-center gap-2 ${isCompleted ? "text-muted-foreground line-through decoration-2 decoration-border/50" : ""}`}>
                                            <span className="text-lg">{chore.emoji || "📋"}</span>
                                            <span className="font-bold text-sm truncate">{chore.title}</span>
                                        </div>
                                        <div className={`text-xs flex items-center gap-2 mt-1 ${isCompleted ? "opacity-50" : "text-muted-foreground"}`}>
                                            <span className={`px-2 py-0.5 rounded-md border border-border text-[10px] font-bold shadow-[1px_1px_0px_0px_var(--shadow-color)] ${
                                                isCompleted
                                                ? "bg-muted text-muted-foreground"
                                                : "bg-secondary text-secondary-foreground"
                                            }`}>{chore.pointValue} pts</span>
                                            {assignee && (
                                                <div className="flex items-center gap-1 ml-auto">
                                                    <Avatar className="w-5 h-5 border border-border">
                                                        <AvatarImage src={assignee.profileImageUrl || ""} />
                                                        <AvatarFallback className="text-[8px] font-bold">
                                                            {assignee.name.slice(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </div>
                                            )}
                                            {!assignee && chore.assignedToIds && chore.assignedToIds.length > 0 && (
                                                <span className="text-[10px] opacity-70">Assigned</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    )}
                </div>
            </div>
          </div>
        );
      })}
      
      {days.every(({ date }) => {
          const { dayChores, dayEvents } = getItemsForDay(date);
          return dayChores.length === 0 && dayEvents.length === 0;
      }) && (
          <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-xl border-2 border-dashed border-border">
              <div className="font-bold text-lg mb-2">No Tasks Found</div>
              <p>No tasks or events scheduled for this period.</p>
          </div>
      )}
    </div>
  );
}
