"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DragState } from "@/types";
import { GRID_PX, TOTAL_MIN, START_HOUR, END_HOUR } from "@/features/calendar/constants";

// Extended drag state that includes the original start time
type InternalDragState = NonNullable<DragState> & {
  originalStartMinutes: number;
};

type UseDragAndDropOptions = {
  onDragEnd: (dragState: NonNullable<DragState>) => void;
};

export function useDragAndDrop({ onDragEnd }: UseDragAndDropOptions) {
  const [dragState, setDragState] = useState<InternalDragState | null>(null);
  
  // Use refs to avoid re-running useEffect on every state change
  const dragStateRef = useRef<InternalDragState | null>(null);
  const onDragEndRef = useRef(onDragEnd);
  onDragEndRef.current = onDragEnd;
  
  // Track if we actually moved during drag (to distinguish from clicks)
  const hasDraggedRef = useRef(false);
  // Track the last drag end time to prevent click from firing
  const lastDragEndRef = useRef(0);
  // Track if we're currently processing a drag end to prevent duplicates
  const processingDragEndRef = useRef(false);

  // Keep dragStateRef in sync with state
  dragStateRef.current = dragState;

  // Shared move handler for both mouse and touch
  const handleMove = useCallback((clientX: number, clientY: number, movementX = 0, movementY = 0) => {
    const currentDrag = dragStateRef.current;
    if (!currentDrag) return;

    // Mark that we've actually dragged (moved)
    if (Math.abs(movementX) > 2 || Math.abs(movementY) > 2) {
      hasDraggedRef.current = true;
    }

    const minPerPx = TOTAL_MIN / GRID_PX;
    const deltaX = clientX - currentDrag.initialClientX;
    const deltaY = clientY - currentDrag.initialClientY;
    const dayOffset = Math.round(deltaX / currentDrag.columnWidth);

    // Calculate new start time based on TOTAL delta from ORIGINAL position
    const rawNewStart = currentDrag.originalStartMinutes + deltaY * minPerPx;

    // Clamp to visible grid range (START_HOUR to END_HOUR minus duration)
    const minStart = START_HOUR * 60;
    const maxStart = END_HOUR * 60 - currentDrag.durationMinutes;
    const newStart = Math.max(minStart, Math.min(maxStart, rawNewStart));

    // Only update if values changed significantly (reduce re-renders)
    if (Math.abs(newStart - currentDrag.startMinutes) > 0.5 || dayOffset !== currentDrag.dayOffset) {
      const newState = {
        ...currentDrag,
        startMinutes: newStart,
        dayOffset: dayOffset,
      };
      // Update ref immediately so mouseup/touchend gets the latest value
      dragStateRef.current = newState;
      setDragState(newState);
    }
  }, []);

  // Shared end handler for both mouse and touch
  const handleEnd = useCallback(() => {
    // Prevent duplicate calls
    if (processingDragEndRef.current) {
      console.log("⚠️ Duplicate drag end call prevented");
      return;
    }

    // Use setState callback to ensure we get the LATEST state value
    // This avoids race conditions where mouseup/touchend fires before React re-renders
    setDragState((currentDrag) => {
      if (currentDrag && hasDraggedRef.current && !processingDragEndRef.current) {
        processingDragEndRef.current = true;
        // Pass the drag state without the internal originalStartMinutes field
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { originalStartMinutes, ...publicDragState } = currentDrag;
        console.log("🖱️ Calling onDragEnd for:", publicDragState.id);
        onDragEndRef.current(publicDragState);
        lastDragEndRef.current = Date.now();

        // Reset processing flag after a short delay
        setTimeout(() => {
          processingDragEndRef.current = false;
          hasDraggedRef.current = false;
        }, 100);
      }
      return null; // Clear the drag state
    });
  }, []);

  // Track last touch position for calculating movement
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);

  // Global drag handlers - only attach/detach when dragging starts/stops
  useEffect(() => {
    // Only set up listeners when dragging is active
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY, e.movementX, e.movementY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];

      // Calculate movement from last touch position
      const lastTouch = lastTouchRef.current;
      const movementX = lastTouch ? touch.clientX - lastTouch.x : 0;
      const movementY = lastTouch ? touch.clientY - lastTouch.y : 0;
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };

      handleMove(touch.clientX, touch.clientY, movementX, movementY);

      // Prevent scrolling while dragging
      e.preventDefault();
    };

    const handleMouseUp = () => {
      handleEnd();
    };

    const handleTouchEnd = () => {
      lastTouchRef.current = null;
      handleEnd();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!dragState, handleMove, handleEnd]); // Only re-run when dragging starts/stops (boolean change)

  const startDrag = useCallback(
    (
      id: string,
      startMinutes: number,
      durationMinutes: number,
      clientX: number,
      clientY: number,
      columnWidth: number
    ) => {
      hasDraggedRef.current = false;
      setDragState({
        id,
        startMinutes,
        originalStartMinutes: startMinutes, // Store the original for calculations
        durationMinutes,
        dayOffset: 0,
        initialClientX: clientX,
        initialClientY: clientY,
        columnWidth,
      });
    },
    []
  );

  // Check if we just finished dragging (to prevent click handlers from firing)
  const wasJustDragging = useCallback(() => {
    return Date.now() - lastDragEndRef.current < 200;
  }, []);

  // Return the drag state directly - no memoization needed since we control updates
  const publicDragState: DragState = dragState ? {
    id: dragState.id,
    startMinutes: dragState.startMinutes,
    durationMinutes: dragState.durationMinutes,
    dayOffset: dragState.dayOffset,
    initialClientX: dragState.initialClientX,
    initialClientY: dragState.initialClientY,
    columnWidth: dragState.columnWidth,
  } : null;

  return {
    dragState: publicDragState,
    startDrag,
    isDragging: dragState !== null,
    wasJustDragging,
  };
}
