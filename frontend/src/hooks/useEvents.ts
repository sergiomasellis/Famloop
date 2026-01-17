"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { EventItem, DragState } from "@/types";
import { addDays } from "@/lib/date";

// Convert Convex event to frontend EventItem
function convexEventToEventItem(event: {
  _id: Id<"events">;
  title: string;
  emoji?: string;
  description?: string;
  startTime: number;
  endTime: number;
  participants?: Array<{ _id: Id<"users">; name: string } | null>;
}): EventItem {
  return {
    id: event._id,
    title: event.title,
    emoji: event.emoji || "📌",
    description: event.description || undefined,
    start: new Date(event.startTime),
    end: new Date(event.endTime),
    participants: (event.participants || [])
      .filter((p): p is { _id: Id<"users">; name: string } => p !== null)
      .map((p) => ({
        id: p._id as string,
        name: p.name,
      })),
  };
}

export function useEvents(
  dragState: DragState,
  familyId?: Id<"families">,
  weekStart?: Date
) {
  const [error, setError] = useState<string | null>(null);

  // Ref to prevent duplicate commitDrag calls
  const committingDragRef = useRef<string | null>(null);

  // Calculate date range for the query
  const startDate = weekStart ? weekStart.getTime() : 0;
  const endDate = weekStart
    ? new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000).getTime()
    : 0;

  // Query events from Convex - reactive and real-time!
  const convexEvents = useQuery(
    api.events.getCurrentFamilyEvents,
    weekStart ? { startDate, endDate } : "skip"
  );

  // Mutations
  const createEventMutation = useMutation(api.events.create);
  const updateEventMutation = useMutation(api.events.update);
  const deleteEventMutation = useMutation(api.events.remove);
  const moveEventMutation = useMutation(api.events.move);

  // Convert Convex events to EventItem format
  const eventList = useMemo(() => {
    if (!convexEvents) return [];
    return convexEvents.map(convexEventToEventItem);
  }, [convexEvents]);

  // Store eventList in ref for stable callbacks
  const eventListRef = useRef(eventList);
  eventListRef.current = eventList;

  const loading = convexEvents === undefined;

  // Merged events with drag state applied for real-time preview
  const mergedEvents = useMemo(() => {
    if (!dragState) return eventList;

    return eventList.map((ev) => {
      if (ev.id === dragState.id) {
        // Get the original event's date in local time (year, month, day only)
        const originalDate = new Date(ev.start);
        const targetDate = new Date(
          originalDate.getFullYear(),
          originalDate.getMonth(),
          originalDate.getDate()
        );

        // Add day offset to get the target day
        const finalTargetDate = addDays(targetDate, dragState.dayOffset);

        // Set the time on the target date (in local time)
        const h = Math.floor(dragState.startMinutes / 60);
        const m = Math.floor(dragState.startMinutes % 60);
        finalTargetDate.setHours(h, m, 0, 0);

        const finalStart = finalTargetDate;
        const finalEnd = new Date(
          finalStart.getTime() + dragState.durationMinutes * 60000
        );

        return { ...ev, start: finalStart, end: finalEnd };
      }
      return ev;
    });
  }, [eventList, dragState]);

  const addEvent = useCallback(
    async (event: Omit<EventItem, "id">): Promise<EventItem | null> => {
      try {
        setError(null);
        const eventId = await createEventMutation({
          title: event.title,
          description: event.description,
          emoji: event.emoji,
          startTime: event.start.getTime(),
          endTime: event.end.getTime(),
          participantIds: event.participants?.map((p) => p.id as Id<"users">),
          source: "manual",
        });

        return {
          id: eventId,
          ...event,
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      }
    },
    [createEventMutation]
  );

  const updateEvent = useCallback(
    async (
      id: string,
      updates: Partial<Omit<EventItem, "id">>
    ): Promise<EventItem | null> => {
      try {
        setError(null);
        await updateEventMutation({
          id: id as Id<"events">,
          title: updates.title,
          description: updates.description,
          emoji: updates.emoji,
          startTime: updates.start?.getTime(),
          endTime: updates.end?.getTime(),
          participantIds: updates.participants?.map((p) => p.id as Id<"users">),
        });

        // The query will automatically update with the new data
        const existingEvent = eventListRef.current.find((e) => e.id === id);
        if (existingEvent) {
          return { ...existingEvent, ...updates };
        }
        return null;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      }
    },
    [updateEventMutation]
  );

  const deleteEvent = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null);
        await deleteEventMutation({ id: id as Id<"events"> });
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return false;
      }
    },
    [deleteEventMutation]
  );

  const commitDrag = useCallback(
    async (drag: NonNullable<DragState>) => {
      // Prevent duplicate calls for the same drag operation
      if (committingDragRef.current === drag.id) {
        console.log("⚠️ Duplicate commitDrag call prevented for:", drag.id);
        return;
      }
      committingDragRef.current = drag.id;

      try {
        // Find the event being dragged
        const event = eventListRef.current.find((ev) => ev.id === drag.id);
        if (!event) {
          committingDragRef.current = null;
          return;
        }

        // Calculate new times
        const originalDate = new Date(event.start);
        const targetDate = new Date(
          originalDate.getFullYear(),
          originalDate.getMonth(),
          originalDate.getDate()
        );

        // Add day offset to get the target day
        const finalTargetDate = addDays(targetDate, drag.dayOffset);

        // Set the time on the target date (in local time)
        const snappedStartMin = Math.round(drag.startMinutes / 15) * 15;
        const h = Math.floor(snappedStartMin / 60);
        const m = snappedStartMin % 60;
        finalTargetDate.setHours(h, m, 0, 0);

        const finalStart = finalTargetDate;
        const finalEnd = new Date(
          finalStart.getTime() + drag.durationMinutes * 60000
        );

        // Use the move mutation for efficiency
        await moveEventMutation({
          id: drag.id as Id<"events">,
          startTime: finalStart.getTime(),
          endTime: finalEnd.getTime(),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        // Clear the committing flag after a short delay
        setTimeout(() => {
          committingDragRef.current = null;
        }, 100);
      }
    },
    [moveEventMutation]
  );

  return {
    eventList,
    mergedEvents,
    loading,
    error,
    setEventList: () => {}, // Not needed with Convex - data is reactive
    addEvent,
    updateEvent,
    deleteEvent,
    commitDrag,
    refetch: () => {}, // Not needed with Convex - it's reactive
  };
}
