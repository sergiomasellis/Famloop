"use client";

import { useState, useCallback } from "react";
import { format } from "date-fns";
import { EventItem, EventParticipant } from "@/types";

export type EventEditorState = {
  editingId: string | null;
  title: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  participantIds: string[]; // Store as IDs for unique identification
  // Recurrence fields
  isRecurring: boolean;
  recurrenceType: "daily" | "weekly" | "monthly";
  daysOfWeek: number[];
  recurrenceEndDate: string;
};

export function useEventEditor() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  // Recurrence state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");

  const openEditor = useCallback((e: EventItem, sliceKey: string) => {
    setEditingId(sliceKey);
    setTitle(e.title);
    setStartDate(format(e.start, "yyyy-MM-dd"));
    setEndDate(format(e.end, "yyyy-MM-dd"));
    setStartTime(format(e.start, "HH:mm"));
    setEndTime(format(e.end, "HH:mm"));
    setLocation(e.description ?? "");
    // Convert EventParticipant[] to string[] (IDs)
    setParticipants((e.participants || []).map((p) => p.id));
    // Set recurrence fields
    setIsRecurring(e.isRecurring ?? false);
    setRecurrenceType(e.recurrenceType ?? "weekly");
    setDaysOfWeek(e.daysOfWeek ?? [e.start.getDay()]);
    setRecurrenceEndDate(e.recurrenceEndDate ? format(e.recurrenceEndDate, "yyyy-MM-dd") : "");
  }, []);

  const closeEditor = useCallback(() => {
    setEditingId(null);
  }, []);

  // Returns event data without participants - call getParticipantNames() separately
  const getUpdatedEvent = useCallback((): Omit<Partial<EventItem>, 'participants'> | null => {
    if (!editingId) return null;

    const start = new Date(startDate + "T" + startTime);
    let end = new Date(endDate + "T" + endTime);

    if (end.getTime() < start.getTime()) {
      end = new Date(start.getTime() + 30 * 60 * 1000);
    }

    return {
      title: title || "Untitled",
      description: location || undefined,
      start,
      end,
      // Recurrence fields
      isRecurring,
      recurrenceType: isRecurring ? recurrenceType : undefined,
      recurrenceCount: isRecurring ? 1 : undefined,
      daysOfWeek: isRecurring && recurrenceType === "weekly" ? daysOfWeek : undefined,
      recurrenceEndDate: isRecurring && recurrenceEndDate
        ? new Date(recurrenceEndDate + "T23:59:59")
        : undefined,
    };
  }, [editingId, title, startDate, endDate, startTime, endTime, location, isRecurring, recurrenceType, daysOfWeek, recurrenceEndDate]);

  // Returns participant IDs - caller should convert to EventParticipant[] using familyMembers
  const getParticipantIds = useCallback((): string[] => {
    return participants;
  }, [participants]);

  const getEventIdFromSliceKey = useCallback((sliceKey: string): string => {
    // SliceKey format: "evt-{number}-{yyyy-MM-dd}"
    // Remove the trailing date "-yyyy-MM-dd" to get "evt-{number}"
    return sliceKey.replace(/-\d{4}-\d{2}-\d{2}$/, "");
  }, []);

  return {
    editingId,
    setEditingId,
    title,
    setTitle,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    location,
    setLocation,
    participants,
    setParticipants,
    // Recurrence
    isRecurring,
    setIsRecurring,
    recurrenceType,
    setRecurrenceType,
    daysOfWeek,
    setDaysOfWeek,
    recurrenceEndDate,
    setRecurrenceEndDate,
    // Methods
    openEditor,
    closeEditor,
    getUpdatedEvent,
    getParticipantIds,
    getEventIdFromSliceKey,
  };
}
