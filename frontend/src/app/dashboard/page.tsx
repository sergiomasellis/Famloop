"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState, useCallback, useRef } from "react";
import { format } from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
} from "lucide-react";

// Types
import { EventItem, HoverPreview as HoverPreviewType, DragState } from "@/types";
import { Chore, ChoreCreate, ChoreUpdate } from "@/hooks/useChores";
import { FamilyMember } from "@/hooks/useFamilyMembers";
import { Id } from "../../../convex/_generated/dataModel";

// Utilities
import { addDays, dayKey, minutesFromMidnight } from "@/lib/date";
import { isChoreOnDay } from "@/lib/chore-utils";

// Hooks
import { useCalendarNavigation } from "@/hooks/useCalendarNavigation";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useEvents } from "@/hooks/useEvents";
import { useEventEditor } from "@/hooks/useEventEditor";
import { useChores } from "@/hooks/useChores";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { useFamily } from "@/hooks/useFamily";

// Calendar utilities and constants
import {
  GRID_PX,
  START_HOUR,
  END_HOUR,
  TOTAL_MIN,
  EVENT_COLORS,
} from "@/features/calendar/constants";
import {
  layoutOverlaps,
  eventBlockStyle,
  calcSlot,
  getEventsForDay,
} from "@/features/calendar/utils/layout";

// Calendar components
import { HourRail } from "@/features/calendar/components/HourLines";
import { HoverPreview } from "@/features/calendar/components/HoverPreview";
import { MonthView } from "@/features/calendar/components/MonthView";
import { TaskView } from "@/features/calendar/components/TaskView";

// Chore components
import { ChoreCard } from "@/features/chores/components/ChoreCard";
import { ChoreDialog } from "@/features/chores/components/ChoreDialog";

// Participant selector component
import { ParticipantSelector } from "@/components/ParticipantSelector";

// Responsive event editor
import { EventEditorResponsive } from "@/components/EventEditorResponsive";

function DashboardPageContent() {
  // Calendar navigation state
  const {
    view,
    setView,
    weekStart,
    days,
    monthGrid,
    selectedDay,
    goNext,
    goPrev,
  } = useCalendarNavigation();

  // Family management - fetch or create family (needed before events)
  const { family, createFamily, refetch: refetchFamily } = useFamily();
  const FAMILY_ID = family?._id;

  // Commit drag ref - will be set after useEvents is called
  const commitDragRef = useRef<((drag: NonNullable<DragState>) => Promise<void>) | null>(null);
  // Track which event is being dragged to prevent clicks during drag
  const draggingEventIdRef = useRef<string | null>(null);
  
  const handleDragEnd = useCallback((drag: NonNullable<DragState>) => {
    commitDragRef.current?.(drag);
    // Clear the dragging event ID after a short delay
    setTimeout(() => {
      draggingEventIdRef.current = null;
    }, 100);
  }, []);

  // Drag and drop - call FIRST so we have dragState for useEvents
  const { dragState, startDrag, isDragging, wasJustDragging } = useDragAndDrop({
    onDragEnd: handleDragEnd,
  });
  
  // Track which event is being dragged
  useEffect(() => {
    draggingEventIdRef.current = dragState?.id ?? null;
  }, [dragState?.id]);

  // Events management - uses dragState directly from hook (no sync needed)
  const {
    mergedEvents,
    addEvent,
    updateEvent,
    deleteEvent: removeEvent,
    commitDrag,
  } = useEvents(dragState, FAMILY_ID, weekStart);

  // Update the ref after useEvents provides commitDrag
  commitDragRef.current = commitDrag;

  // Event editor state
  const editor = useEventEditor();

  // Chores management - pass weekStart timestamp
  const weekStartTimestamp = weekStart.getTime();
  const {
    chores: apiChores,
    loading: choresLoading,
    createChore,
    updateChore,
    deleteChore: removeChore,
    toggleComplete,
  } = useChores(weekStartTimestamp);

  // Family members for assignment - uses authenticated user's family automatically
  const { members: familyMembers } = useFamilyMembers(FAMILY_ID);

  // Chore dialog state
  const [choreDialogOpen, setChoreDialogOpen] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);

  // New Event dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftStartDate, setDraftStartDate] = useState<string>(() =>
    format(new Date(), "yyyy-MM-dd")
  );
  const [draftEndDate, setDraftEndDate] = useState<string>(() =>
    format(new Date(), "yyyy-MM-dd")
  );
  const [draftStart, setDraftStart] = useState<string>("09:00");
  const [draftEnd, setDraftEnd] = useState<string>("10:00");
  const [draftLocation, setDraftLocation] = useState<string>("");
  const [draftParticipants, setDraftParticipants] = useState<string[]>([]);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);

  // Hover preview state
  const [hoverPreview, setHoverPreview] = useState<HoverPreviewType>(null);

  // Close dialog when editing an event
  useEffect(() => {
    if (openDialog && editor.editingId) {
      setOpenDialog(false);
    }
  }, [openDialog, editor.editingId]);

  // Clear error when dialog opens
  useEffect(() => {
    if (openDialog) {
      setEventError(null);
    }
  }, [openDialog]);

  // Current time indicator
  const [nowTop, setNowTop] = useState<number | null>(null);
  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const mins = (now.getHours() - START_HOUR) * 60 + now.getMinutes();
      const pct = Math.min(1, Math.max(0, mins / TOTAL_MIN));
      setNowTop(pct * GRID_PX);
    };
    calc();
    const id = setInterval(calc, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Chore handlers
  const handleSaveChore = async (
    data: ChoreCreate | ChoreUpdate,
    choreId?: Id<"chores">
  ) => {
    if (choreId !== undefined) {
      await updateChore(choreId, data as ChoreUpdate);
    } else {
      await createChore(data as ChoreCreate);
    }
  };

  const handleEditChore = (chore: Chore) => {
    setEditingChore(chore);
    setChoreDialogOpen(true);
  };

  const handleDeleteChore = async (chore: Chore) => {
    if (confirm(`Are you sure you want to delete "${chore.title}"?`)) {
      await removeChore(chore._id);
    }
  };

  const handleToggleComplete = async (chore: Chore) => {
    await toggleComplete(chore._id);
  };

  const handleOpenNewChore = () => {
    setEditingChore(null);
    setChoreDialogOpen(true);
  };

  // Get chores for a specific day using the utility function
  const getChoresForDay = (date: Date): Chore[] => {
    return apiChores.filter((chore) => isChoreOnDay(chore, date));
  };

  const handleChoreClick = (chore: Chore) => {
    handleEditChore(chore);
  };

  // Create new event handler
  async function addNewEvent() {
    if (!FAMILY_ID) {
      setEventError("Please create or join a family first");
      return;
    }

    setIsCreatingEvent(true);
    setEventError(null);

    try {
      const startDateTime = new Date(draftStartDate + "T" + draftStart);
      const endDateTime = new Date(draftEndDate + "T" + draftEnd);

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        setEventError("Please enter valid dates and times");
        setIsCreatingEvent(false);
        return;
      }

      if (endDateTime.getTime() < startDateTime.getTime()) {
        endDateTime.setTime(startDateTime.getTime() + 30 * 60 * 1000);
      }

      // Convert participant names to EventParticipant objects
      const participantObjects = draftParticipants
        .map((name) => {
          const member = familyMembers.find((m) => m.name === name);
          if (!member) return null;
          return { id: member._id as string, name: member.name };
        })
        .filter((p): p is { id: string; name: string } => p !== null);

      const result = await addEvent({
        title: draftTitle || "Untitled",
        emoji: "📌",
        description: draftLocation || undefined,
        start: startDateTime,
        end: endDateTime,
        participants: participantObjects,
      });

      if (result) {
        // Reset draft
        setDraftTitle("");
        setDraftLocation("");
        setDraftParticipants([]);
        setEventError(null);
        setOpenDialog(false);
      } else {
        setEventError("Failed to create event. Please try again.");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      setEventError(error instanceof Error ? error.message : "Failed to create event. Please try again.");
    } finally {
      setIsCreatingEvent(false);
    }
  }

  // Click-to-create handlers
  function openCreateAt(date: Date, yWithinGridPx: number) {
    const { base, end, topPx } = calcSlot(date, yWithinGridPx);
    if (topPx < 0 || topPx >= GRID_PX) return;

    const dayIso = format(date, "yyyy-MM-dd");
    setDraftStartDate(dayIso);
    setDraftEndDate(dayIso);
    setDraftStart(format(base, "HH:mm"));
    setDraftEnd(format(end, "HH:mm"));
    setDraftTitle("");
    setDraftLocation("");
    setDraftParticipants([]);
    setOpenDialog(true);
  }

  function updateHoverPreview(date: Date, yWithinGridPx: number) {
    const { topPx, heightPx } = calcSlot(date, yWithinGridPx);
    const nextKey = `${format(date, "yyyy-MM-dd")}-${Math.round(topPx)}-${Math.round(heightPx)}`;
    setHoverPreview((prev) => {
      if (prev && prev.key === nextKey) return prev;
      return { date, topPx, heightPx, key: nextKey };
    });
  }

  // Edit handlers
  function openEditor(e: EventItem) {
    editor.setTitle(e.title);
    editor.setStartDate(format(e.start, "yyyy-MM-dd"));
    editor.setEndDate(format(e.end, "yyyy-MM-dd"));
    editor.setStartTime(format(e.start, "HH:mm"));
    editor.setEndTime(format(e.end, "HH:mm"));
    editor.setLocation(e.description ?? "");
    // Convert EventParticipant[] to string[] (names)
    editor.setParticipants((e.participants || []).map((p) => p.name));
  }

  async function saveEdit() {
    const updates = editor.getUpdatedEvent();
    if (!updates || !editor.editingId) return;

    // Convert participant names to EventParticipant[]
    const participantNames = editor.getParticipantNames();
    const participantObjects = participantNames
      .map((name) => {
        const member = familyMembers.find((m) => m.name === name);
        if (!member) return null;
        return { id: member._id as string, name: member.name };
      })
      .filter((p): p is { id: string; name: string } => p !== null);

    const eventId = editor.getEventIdFromSliceKey(editor.editingId);
    const result = await updateEvent(eventId, {
      ...updates,
      participants: participantObjects,
    });
    if (result) {
      editor.closeEditor();
    }
  }

  async function deleteEvent() {
    if (!editor.editingId) return;
    const eventId = editor.getEventIdFromSliceKey(editor.editingId);
    const success = await removeEvent(eventId);
    if (success) {
      editor.closeEditor();
    }
  }

  // Handle column click to detect if clicking on event or empty space
  const handleColumnClick = (date: Date, y: number, dayEvents: EventItem[]) => {
    const pct = y / GRID_PX;
    const minutesFromStart = Math.round(pct * TOTAL_MIN);
    const clickedMinutes = Math.max(
      START_HOUR * 60,
      Math.min(END_HOUR * 60, START_HOUR * 60 + minutesFromStart)
    );

    const hit = dayEvents.find((ev) => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      const start = new Date(Math.max(ev.start.getTime(), dayStart.getTime()));
      const end = new Date(Math.min(ev.end.getTime(), dayEnd.getTime()));
      const startMin = Math.max(START_HOUR * 60, minutesFromMidnight(start));
      const endMin = Math.min(END_HOUR * 60, minutesFromMidnight(end));
      return clickedMinutes >= startMin && clickedMinutes <= endMin;
    });

    if (hit) {
      openEditor(hit);
      return hit;
    }

    openCreateAt(date, y);
    return null;
  };

  // Event editor form content (shared between mobile and desktop)
  const renderEventEditorContent = () => (
    <>
      <div className="grid gap-2">
        <label className="text-sm font-medium">Title</label>
        <Input
          value={editor.title}
          onChange={(e) => editor.setTitle(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2 min-w-0">
          <label className="text-sm font-medium">Start Date</label>
          <Input
            type="date"
            value={editor.startDate}
            className="w-full min-w-0 appearance-none [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            onChange={(e) => {
              const nextStart = e.target.value;
              editor.setStartDate(nextStart);
              if (
                editor.endDate &&
                nextStart &&
                editor.endDate < nextStart
              ) {
                editor.setEndDate(nextStart);
              }
            }}
          />
        </div>
        <div className="grid gap-2 min-w-0">
          <label className="text-sm font-medium">End Date</label>
          <Input
            type="date"
            value={editor.endDate}
            min={editor.startDate || undefined}
            className="w-full min-w-0 appearance-none [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            onChange={(e) => {
              const nextEnd = e.target.value;
              if (
                editor.startDate &&
                nextEnd &&
                nextEnd < editor.startDate
              ) {
                editor.setEndDate(editor.startDate);
              } else {
                editor.setEndDate(nextEnd);
              }
            }}
          />
        </div>
        <div className="grid gap-2 col-span-2">
          <span className="text-sm font-medium">Time</span>
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex-1 min-w-0">
              <Input
                type="time"
                value={editor.startTime}
                onChange={(e) => editor.setStartTime(e.target.value)}
                className="w-full min-w-0 pr-8 appearance-none"
              />
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              to
            </span>
            <div className="flex-1 min-w-0">
              <Input
                type="time"
                value={editor.endTime}
                onChange={(e) => editor.setEndTime(e.target.value)}
                className="w-full min-w-0 pr-8 appearance-none"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium">
          Location / Description
        </label>
        <Input
          value={editor.location}
          onChange={(e) => editor.setLocation(e.target.value)}
          placeholder="Optional"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium">Participants</label>
        <ParticipantSelector
          familyMembers={familyMembers}
          selectedNames={editor.participants}
          onChange={editor.setParticipants}
          placeholder="Select family members..."
        />
      </div>
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation();
            deleteEvent();
          }}
        >
          <Trash2 className="mr-2 size-4" />
          Delete
        </Button>
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            saveEdit();
          }}
        >
          <Save className="mr-2 size-4" />
          Save Changes
        </Button>
      </div>
    </>
  );

  // Render event block
  const renderEventBlock = (
    e: EventItem,
    dayDate: Date,
    idx: number,
    positions: Record<string, { left: string; width: string }>
  ) => {
    const sliceKey = `${e.id}-${dayKey(dayDate)}`;
    const isEditing = editor.editingId === sliceKey;

    const eventBlockElement = (
      <div
        role="button"
        tabIndex={0}
        className={`timegrid-event cursor-pointer text-left select-none ${
          EVENT_COLORS[idx % EVENT_COLORS.length]
        } ${
          dragState?.id === e.id
            ? "opacity-80 z-50 shadow-xl scale-[1.02]"
            : ""
        }`}
        style={{
          ...eventBlockStyle(e, dayDate, dragState),
          position: "absolute",
          left: positions[e.id]?.left ?? "0%",
          width: positions[e.id]?.width ?? "100%",
          maxHeight: GRID_PX,
          overflow: "hidden",
          boxSizing: "border-box",
          right: "6px",
          transition:
            dragState?.id === e.id ? "none" : "transform 0.1s, box-shadow 0.1s",
        }}
        data-col-date={format(dayDate, "yyyy-MM-dd")}
        onMouseDown={(ev) => {
          ev.stopPropagation();
          const startMin = minutesFromMidnight(e.start);
          const endMin = minutesFromMidnight(e.end);
          const duration = endMin - startMin;
          const colWidth = (ev.currentTarget.parentElement?.offsetWidth ?? ev.currentTarget.offsetWidth);

          startDrag(
            e.id,
            startMin,
            duration,
            ev.clientX,
            ev.clientY,
            colWidth
          );
        }}
        onTouchStart={(ev) => {
          if (ev.touches.length !== 1) return;
          ev.stopPropagation();
          const touch = ev.touches[0];
          const startMin = minutesFromMidnight(e.start);
          const endMin = minutesFromMidnight(e.end);
          const duration = endMin - startMin;
          const colWidth = (ev.currentTarget.parentElement?.offsetWidth ?? ev.currentTarget.offsetWidth);

          startDrag(
            e.id,
            startMin,
            duration,
            touch.clientX,
            touch.clientY,
            colWidth
          );
        }}
        onClick={(ev) => {
          ev.stopPropagation();
          if (draggingEventIdRef.current === e.id || isDragging || wasJustDragging()) return;

          requestAnimationFrame(() => {
            editor.setEditingId(sliceKey);
            openEditor(e);
          });
        }}
        onKeyDown={(ev) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            ev.stopPropagation();
            if (draggingEventIdRef.current === e.id || isDragging || wasJustDragging()) return;

            requestAnimationFrame(() => {
              editor.setEditingId(sliceKey);
              openEditor(e);
            });
          }
        }}
        aria-label={`Edit event ${e.title}`}
      >
        <div className="title-row">
          <div className="title">
            <span className="mr-1">{e.emoji}</span>
            {e.title}
          </div>
        </div>
        <div className="time">
          {format(e.start, "p")} – {format(e.end, "p")}
        </div>
        {e.description ? <div className="desc">{e.description}</div> : null}
        <div className="mt-2 flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background *:data-[slot=avatar]:grayscale">
          {(e.participants || []).map((p, i) => {
            const member = familyMembers.find((m) => m._id === p.id);
            const src = member?.profileImageUrl || "";
            const initials = p.name
              .split(" ")
              .map((s) => s[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() || "?";
            return (
              <Avatar key={`${p.id}-${i}`} className="size-6">
                <AvatarImage
                  src={src}
                  alt={p.name}
                  onError={(ev) => {
                    (ev.currentTarget as HTMLImageElement).src = "";
                  }}
                />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            );
          })}
        </div>
      </div>
    );

    return (
      <EventEditorResponsive
        key={`editor-${e.id}-${dayKey(dayDate)}`}
        open={isEditing}
        onOpenChange={(o) => {
          if (!o) editor.closeEditor();
        }}
        trigger={eventBlockElement}
        title="Edit Event"
        description="Update details and save."
      >
        {renderEventEditorContent()}
      </EventEditorResponsive>
    );
  };

  // Render day column (used in both week and day views)
  const renderDayColumn = (date: Date, isFullWidth = false) => {
    const dayEvents = getEventsForDay(mergedEvents, date);
    const positions = layoutOverlaps(date, dayEvents);

    return (
      <div
        className={`relative rounded-lg bg-muted/40 overflow-hidden ${
          isFullWidth ? "" : "flex-1"
        }`}
        style={{ minHeight: GRID_PX }}
        onMouseMove={(e) => {
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          const rawY = e.clientY - rect.top;
          const y = Math.max(0, Math.min(GRID_PX - 1, rawY));
          updateHoverPreview(date, y);
        }}
        onMouseLeave={() => setHoverPreview(null)}
        onClick={(e) => {
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          const rawY = e.clientY - rect.top;
          const y = Math.max(0, Math.min(GRID_PX - 1, rawY));
          handleColumnClick(date, y, dayEvents);
        }}
        role="button"
        aria-label={`Create event on ${format(date, "yyyy-MM-dd")}`}
        title="Click to create an event"
      >
        <HoverPreview preview={hoverPreview} date={date} isDragging={isDragging} />

        {dayEvents.map((e, idx) => renderEventBlock(e, date, idx, positions))}
      </div>
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="space-y-5">
        {/* Top toolbar - single row on mobile */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Nav arrows + date */}
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <button
              className="inline-flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg border-2 border-border bg-card shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all touch-manipulation"
              aria-label={
                view === "month"
                  ? "Previous month"
                  : view === "day"
                  ? "Previous day"
                  : "Previous week"
              }
              onClick={goPrev}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              className="inline-flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg border-2 border-border bg-card shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all touch-manipulation"
              aria-label={
                view === "month"
                  ? "Next month"
                  : view === "day"
                  ? "Next day"
                  : "Next week"
              }
              onClick={goNext}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
            <div className="h-8 sm:h-9 flex items-center text-xs sm:text-base font-black uppercase tracking-tight truncate min-w-0 border-2 border-border bg-card px-2 sm:px-3 rounded-lg shadow-[2px_2px_0px_0px_var(--shadow-color)]">
              {view === "month"
                ? format(monthGrid.firstOfMonth, "MMM yy")
                : view === "day"
                ? format(weekStart, "MMM d")
                : view === "task"
                ? "Tasks"
                : `${format(weekStart, "d")}-${format(addDays(weekStart, 6), "d MMM")}`}
            </div>
          </div>

          {/* Right: View toggle + New button */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* View toggle - compact on mobile */}
            <div className="flex gap-0.5 sm:gap-1 p-0.5 sm:p-1 border-2 border-border rounded-lg sm:rounded-xl bg-muted shadow-[2px_2px_0px_0px_var(--shadow-color)]">
              <button
                type="button"
                onClick={() => setView("day")}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-sm font-bold uppercase rounded-md sm:rounded-lg transition-all touch-manipulation ${
                  view === "day"
                    ? "bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] translate-x-[-1px] translate-y-[-1px]"
                    : "text-muted-foreground hover:bg-background hover:text-foreground"
                }`}
                aria-pressed={view === "day"}
              >
                <span className="sm:hidden">D</span>
                <span className="hidden sm:inline">Day</span>
              </button>
              <button
                type="button"
                onClick={() => setView("week")}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-sm font-bold uppercase rounded-md sm:rounded-lg transition-all touch-manipulation ${
                  view === "week"
                    ? "bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] translate-x-[-1px] translate-y-[-1px]"
                    : "text-muted-foreground hover:bg-background hover:text-foreground"
                }`}
                aria-pressed={view === "week"}
              >
                <span className="sm:hidden">W</span>
                <span className="hidden sm:inline">Week</span>
              </button>
              <button
                type="button"
                onClick={() => setView("month")}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-sm font-bold uppercase rounded-md sm:rounded-lg transition-all touch-manipulation ${
                  view === "month"
                    ? "bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] translate-x-[-1px] translate-y-[-1px]"
                    : "text-muted-foreground hover:bg-background hover:text-foreground"
                }`}
                aria-pressed={view === "month"}
              >
                <span className="sm:hidden">M</span>
                <span className="hidden sm:inline">Month</span>
              </button>
              <button
                type="button"
                onClick={() => setView("task")}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-sm font-bold uppercase rounded-md sm:rounded-lg transition-all touch-manipulation ${
                  view === "task"
                    ? "bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] translate-x-[-1px] translate-y-[-1px]"
                    : "text-muted-foreground hover:bg-background hover:text-foreground"
                }`}
                aria-pressed={view === "task"}
              >
                <span className="sm:hidden">T</span>
                <span className="hidden sm:inline">Tasks</span>
              </button>
            </div>

            {/* Dialog trigger */}
            <Dialog
              open={openDialog}
              onOpenChange={(next) => {
                if (next === false) {
                  setOpenDialog(false);
                } else {
                  const active =
                    typeof window !== "undefined"
                      ? (document.activeElement as HTMLElement | null)
                      : null;
                  const isNewButton = !!active?.closest?.('[data-open="new-event"]');
                  if (isNewButton) {
                    setOpenDialog(true);
                  }
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  className="inline-flex items-center justify-center gap-2 rounded-full h-8 w-8 sm:h-auto sm:w-auto sm:px-4 sm:py-2 text-xs sm:text-sm font-medium shadow-sm touch-manipulation"
                  aria-label="Add item"
                  data-open="new-event"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  <span className="hidden sm:inline">New</span>
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle>Create Event</DialogTitle>
                  <DialogDescription>
                    Set the event details and click Add Event to place it on your
                    calendar.
                  </DialogDescription>
                </DialogHeader>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await addNewEvent();
                  }}
                >
                  <div className="grid gap-4">
                    {eventError && (
                      <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                        {eventError}
                      </div>
                    )}
                    <div className="grid gap-2">
                      <label htmlFor="title" className="text-sm font-medium">
                        Title
                      </label>
                      <Input
                        id="title"
                        placeholder="Meet with Jonson Rider"
                        value={draftTitle}
                        onChange={(e) => {
                          setDraftTitle(e.target.value);
                          setEventError(null);
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2 min-w-0">
                        <label className="text-sm font-medium">Start Date</label>
                        <Input
                          type="date"
                          value={draftStartDate}
                          className="w-full min-w-0 appearance-none [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                          onChange={(e) => {
                            const nextStart = e.target.value;
                            setDraftStartDate(nextStart);
                            if (
                              draftEndDate &&
                              nextStart &&
                              draftEndDate < nextStart
                            ) {
                              setDraftEndDate(nextStart);
                            }
                          }}
                        />
                      </div>
                      <div className="grid gap-2 min-w-0">
                        <label className="text-sm font-medium">End Date</label>
                        <Input
                          type="date"
                          value={draftEndDate}
                          min={draftStartDate || undefined}
                          className="w-full min-w-0 appearance-none [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                          onChange={(e) => {
                            const nextEnd = e.target.value;
                            if (
                              draftStartDate &&
                              nextEnd &&
                              nextEnd < draftStartDate
                            ) {
                              setDraftEndDate(draftStartDate);
                            } else {
                              setDraftEndDate(nextEnd);
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <span className="text-sm font-medium">Time</span>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative flex-1 min-w-0">
                          <Input
                            type="time"
                            value={draftStart}
                            onChange={(e) => setDraftStart(e.target.value)}
                            className="w-full min-w-0 pr-8 appearance-none"
                          />
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          to
                        </span>
                        <div className="relative flex-1 min-w-0">
                          <Input
                            type="time"
                            value={draftEnd}
                            onChange={(e) => setDraftEnd(e.target.value)}
                            className="w-full min-w-0 pr-8 appearance-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="location" className="text-sm font-medium">
                        Location / Description
                      </label>
                      <Input
                        id="location"
                        placeholder="Park Lane Office"
                        value={draftLocation}
                        onChange={(e) => setDraftLocation(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="participants" className="text-sm font-medium">
                        Participants
                      </label>
                      <ParticipantSelector
                        familyMembers={familyMembers}
                        selectedNames={draftParticipants}
                        onChange={setDraftParticipants}
                        placeholder="Select family members..."
                      />
                    </div>
                  </div>

                  <DialogFooter className="mt-4">
                    <DialogClose asChild>
                      <Button type="button" variant="outline" disabled={isCreatingEvent}>
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isCreatingEvent}>
                      {isCreatingEvent ? "Creating..." : "Add Event"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Main board */}
        <div className="rounded-lg border p-4">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="size-5" aria-hidden="true" />
            <h1 className="text-xl font-semibold tracking-tight">
              {view === "day"
                ? "Daily Dashboard"
                : view === "week"
                ? "Weekly Dashboard"
                : view === "task"
                ? "Tasks Dashboard"
                : "Monthly Dashboard"}
            </h1>
          </div>
          <Separator className="mb-4" />

           <Tabs defaultValue="events" className="w-full">
             <TabsList className="w-full max-w-xs rounded-full bg-muted/60 p-1">
               <TabsTrigger className="rounded-full" value="events">
                 Events
               </TabsTrigger>
               <TabsTrigger className="rounded-full" value="chores">
                 Chores
               </TabsTrigger>
             </TabsList>

            <TabsContent value="events" className="mt-4">
              {view === "month" ? (
                <MonthView
                  monthGrid={monthGrid}
                  events={mergedEvents}
                  chores={apiChores}
                  onEventClick={openEditor}
                  onChoreClick={handleChoreClick}
                />
              ) : view === "task" ? (
                <TaskView
                  days={days}
                  events={mergedEvents}
                  chores={apiChores}
                  familyMembers={familyMembers}
                  onEventClick={openEditor}
                  onChoreClick={handleChoreClick}
                  onToggleChore={handleToggleComplete}
                />
              ) : view === "week" ? (
                /* WEEK VIEW */
                <div className="rounded-xl border bg-card/90 p-2 sm:p-3 shadow-sm transition hover:shadow-md">
                  <div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div className="text-sm font-semibold">This Week</div>
                    <div className="text-[11px] text-muted-foreground">
                      {format(weekStart, "MMM d")} –{" "}
                      {format(addDays(weekStart, 6), "MMM d")}
                    </div>
                  </div>

                  {/* Mobile: Horizontal scrollable container */}
                  <div className="overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0 touch-pan-x">
                    <div className="min-w-[600px] sm:min-w-0">
                      {/* Weekday headers */}
                      <div className="grid grid-cols-[40px_1fr] sm:grid-cols-[56px_1fr] gap-2 mb-2">
                        <div />
                        <div className="grid grid-cols-7 gap-2 sm:gap-4">
                          {days.map((d) => {
                            const dayChores = getChoresForDay(d.date);
                            const pendingChores = dayChores.filter(c => !c.completed).length;
                            return (
                              <div
                                key={`hdr-${d.key}`}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 min-w-[80px]"
                              >
                                <div className="text-xs sm:text-sm font-semibold">
                                  {format(d.date, "EEE dd")}
                                </div>
                                {pendingChores > 0 && (
                                  <div className="text-[10px] sm:text-[11px] text-muted-foreground">
                                    {pendingChores} chore{pendingChores > 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Chores row - all-day items */}
                      <div className="grid grid-cols-[40px_1fr] sm:grid-cols-[56px_1fr] gap-2 mb-2">
                        <div className="text-[9px] sm:text-[10px] text-muted-foreground text-right pr-1 sm:pr-2 pt-1">Chores</div>
                        <div className="grid grid-cols-7 gap-2 sm:gap-4">
                          {days.map((d) => {
                            const dayChores = getChoresForDay(d.date);
                            return (
                              <div key={`chores-${d.key}`} className="space-y-1 min-h-[24px] min-w-[80px]">
                                {dayChores.slice(0, 3).map((chore) => (
                                  <div
                                    key={`wk-chore-${chore._id}`}
                                    onClick={() => handleChoreClick(chore)}
                                    className={`truncate rounded px-1.5 py-0.5 text-[9px] sm:text-[10px] cursor-pointer transition flex items-center gap-1 touch-manipulation ${
                                      chore.completed
                                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 line-through opacity-60"
                                        : "bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900"
                                    }`}
                                  >
                                    {chore.completed && <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />}
                                    <span>{chore.emoji || "📋"}</span>
                                    <span className="truncate">{chore.title}</span>
                                  </div>
                                ))}
                                {dayChores.length > 3 && (
                                  <div className="text-[8px] sm:text-[9px] text-muted-foreground">+{dayChores.length - 3} more</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-[40px_1fr] sm:grid-cols-[56px_1fr] gap-2">
                        <HourRail />

                        <div className="relative" style={{ height: GRID_PX }}>
                          {/* Hour lines overlay */}
                          <div className="absolute inset-0 z-[5] pointer-events-none">
                            {Array.from({ length: END_HOUR - START_HOUR + 1 }).map(
                              (_, i, arr) => {
                                const top = (i / (arr.length - 1)) * GRID_PX;
                                return (
                                  <div
                                    key={`week-hourline-${i}`}
                                    className="pointer-events-none absolute left-0 right-0"
                                    style={{
                                      top,
                                      borderTop:
                                        "1px solid color-mix(in oklab, var(--foreground), white 90%)",
                                    }}
                                  />
                                );
                              }
                            )}
                            {nowTop !== null && (
                              <div
                                className="current-time-line absolute left-0 right-0"
                                style={{ top: nowTop }}
                              />
                            )}
                          </div>

                          {/* Day columns */}
                          <div className="absolute inset-0 z-[10] grid grid-cols-7 gap-2 sm:gap-4 items-start content-start">
                            {days.map((d) => (
                              <div
                                key={d.key}
                                className="relative flex h-full flex-col min-w-[80px]"
                              >
                                {renderDayColumn(d.date)}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* DAY VIEW */
                <div className="rounded-xl border bg-card/90 p-3 shadow-sm transition hover:shadow-md">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-semibold">
                      {format(selectedDay, "EEEE dd")}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {format(selectedDay, "MMM d, yyyy")}
                    </div>
                  </div>

                  {/* Day chores section */}
                  {(() => {
                    const dayChores = getChoresForDay(selectedDay);
                    if (dayChores.length === 0) return null;
                    return (
                      <div className="mb-3 p-2 rounded-lg bg-muted/40">
                        <div className="text-[10px] font-medium text-muted-foreground mb-2">CHORES DUE</div>
                        <div className="flex flex-wrap gap-2">
                          {dayChores.map((chore) => (
                            <div
                              key={`day-chore-${chore._id}`}
                              onClick={() => handleChoreClick(chore)}
                              className={`rounded-lg px-3 py-2 text-sm cursor-pointer transition flex items-center gap-2 ${
                                chore.completed
                                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 line-through opacity-60"
                                  : "bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900"
                              }`}
                            >
                              {chore.completed && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                              <span className="text-lg">{chore.emoji || "📋"}</span>
                              <div>
                                <div className="font-medium">{chore.title}</div>
                                <div className="text-xs opacity-70">{chore.pointValue} pts</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-[56px_1fr] gap-2">
                    <HourRail />

                    <div className="relative" style={{ height: GRID_PX }}>
                      {/* Hour lines overlay */}
                      <div className="absolute inset-0 z-[5] pointer-events-none">
                        {Array.from({
                          length: END_HOUR - START_HOUR + 1,
                        }).map((_, i, arr) => {
                          const top = (i / (arr.length - 1)) * GRID_PX;
                          return (
                            <div
                              key={`day-hourline-${i}`}
                              className="pointer-events-none absolute left-0 right-0"
                              style={{
                                top,
                                borderTop:
                                  "1px solid color-mix(in oklab, var(--foreground), white 90%)",
                              }}
                            />
                          );
                        })}
                      </div>

                      {/* Current time */}
                      {nowTop !== null &&
                        dayKey(selectedDay) === dayKey(new Date()) && (
                          <div
                            className="current-time-line absolute left-0 right-0 pointer-events-none"
                            style={{ top: nowTop, zIndex: 5 }}
                          />
                        )}

                      {/* Day column */}
                      <div style={{ zIndex: 10, position: "relative", height: GRID_PX }}>
                        {renderDayColumn(selectedDay, true)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="chores" className="mt-4" id="chores">
              {/* Chores toolbar */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  {apiChores.length} chore{apiChores.length !== 1 ? "s" : ""}{" "}
                  ({apiChores.filter((c) => c.completed).length} completed)
                </div>
                <Button onClick={handleOpenNewChore} size="sm">
                  <Plus className="size-4 mr-2" />
                  Add Chore
                </Button>
              </div>

              {choresLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading chores...
                </div>
              ) : apiChores.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground mb-4">
                    No chores yet. Create your first chore!
                  </p>
                  <Button onClick={handleOpenNewChore}>
                    <Plus className="size-4 mr-2" />
                    Create Chore
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {apiChores.map((c, idx) => (
                    <ChoreCard
                      key={c._id}
                      chore={c}
                      familyMembers={familyMembers}
                      colorClass={EVENT_COLORS[idx % EVENT_COLORS.length]}
                      onEdit={handleEditChore}
                      onDelete={handleDeleteChore}
                      onToggleComplete={handleToggleComplete}
                    />
                  ))}
                </div>
              )}
             </TabsContent>
           </Tabs>

          {/* Chore Dialog */}
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
      </div>
    </TooltipProvider>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardPageContent />
    </ProtectedRoute>
  );
}
