"use client";

import { format } from "date-fns";
import { EventItem } from "@/types";
import { Chore } from "@/hooks/useChores";
import { dayKey, addDays } from "@/lib/date";
import { CheckCircle2 } from "lucide-react";
import { isChoreOnDay } from "@/lib/chore-utils";

type MonthGridCell = {
  date: Date;
  inCurrentMonth: boolean;
};

type MonthViewProps = {
  monthGrid: {
    firstOfMonth: Date;
    gridStart: Date;
    cells: MonthGridCell[];
  };
  events: EventItem[];
  chores?: Chore[];
  onEventClick: (event: EventItem) => void;
  onChoreClick?: (chore: Chore) => void;
};

export function MonthView({ monthGrid, events, chores = [], onEventClick, onChoreClick }: MonthViewProps) {
  // Get chores that are due on a specific day
  const getChoresForDay = (date: Date): Chore[] => {
    return chores.filter((chore) => isChoreOnDay(chore, date));
  };

  return (
    <div className="rounded-xl border-2 border-border bg-card p-3 shadow-[4px_4px_0px_0px_var(--shadow-color)] transition hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_var(--shadow-color)]">
      <div className="mb-4 flex items-center justify-between px-1">
        <div className="text-lg font-black uppercase tracking-tight">
          {format(monthGrid.firstOfMonth, "MMMM yyyy")}
        </div>
        <div className="text-xs font-bold text-muted-foreground border-2 border-border px-2 py-1 rounded bg-card">
          {format(monthGrid.gridStart, "MMM d")} –{" "}
          {format(addDays(monthGrid.gridStart, 41), "MMM d")}
        </div>
      </div>

      {/* Month grid: 7 columns x 6 rows */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="text-xs font-black uppercase text-center py-1"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {monthGrid.cells.map((cell, idx) => {
          const isToday = dayKey(cell.date) === dayKey(new Date());
          const dayEvents = events.filter((e) => {
            const ds = new Date(cell.date);
            ds.setHours(0, 0, 0, 0);
            const de = new Date(cell.date);
            de.setHours(23, 59, 59, 999);
            return !(
              e.end.getTime() < ds.getTime() ||
              e.start.getTime() > de.getTime()
            );
          });
          const dayChores = getChoresForDay(cell.date);
          const totalItems = dayEvents.length + dayChores.length;

          return (
            <div
              key={idx}
              className={`rounded-lg border-2 border-border p-2 relative min-h-[100px] transition-all ${
                isToday ? "bg-card ring-2 ring-primary ring-offset-2" : "bg-card hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_0px_var(--shadow-color)]"
              } ${!cell.inCurrentMonth ? "opacity-40 bg-muted" : ""}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`text-sm font-black ${
                    isToday ? "text-primary" : "text-foreground"
                  }`}
                >
                  {format(cell.date, "d")}
                </div>
                {totalItems > 0 && (
                  <div className="text-[10px] font-bold bg-foreground text-background px-1.5 py-0.5 rounded-full">
                    {totalItems}
                  </div>
                )}
              </div>

              {/* Items - events and chores */}
              <div className="space-y-1.5">
                {/* Chores first */}
                {dayChores.slice(0, 2).map((chore) => (
                  <div
                    key={`chore-${chore._id}`}
                    className={`truncate rounded-md px-2 py-1 text-[10px] font-bold border cursor-pointer transition flex items-center gap-1 shadow-[1px_1px_0px_0px_var(--shadow-color)] ${
                      chore.completed
                        ? "bg-green-100 border-green-700 text-green-900 line-through opacity-60"
                        : "bg-violet-100 border-violet-700 text-violet-900 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_0px_var(--shadow-color)]"
                    }`}
                    title={`${chore.title} • ${chore.pointValue} pts`}
                    onClick={() => onChoreClick?.(chore)}
                  >
                    {chore.completed && <CheckCircle2 className="h-3 w-3 shrink-0" />}
                    <span className="mr-1">{chore.emoji || "📋"}</span>
                    <span className="truncate">{chore.title}</span>
                  </div>
                ))}
                
                {/* Events */}
                {dayEvents.slice(0, 3 - Math.min(dayChores.length, 2)).map((e, i) => (
                  <div
                    key={`${e.id}-${i}`}
                    className="truncate rounded-md px-2 py-1 text-[10px] font-bold bg-card border border-border shadow-[1px_1px_0px_0px_var(--shadow-color)] cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] transition"
                    title={`${e.title} • ${format(e.start, "p")}–${format(
                      e.end,
                      "p"
                    )}`}
                    onClick={() => onEventClick(e)}
                  >
                    <span className="mr-1">{e.emoji}</span>
                    {e.title}
                  </div>
                ))}
                
                {totalItems > 3 ? (
                  <div className="text-[10px] font-bold text-center text-muted-foreground bg-muted rounded border border-border">
                    +{totalItems - 3} more
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
