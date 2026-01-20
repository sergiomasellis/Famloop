import {
  isSameDay,
  getDay,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  isBefore,
  startOfDay,
  addDays,
  addWeeks,
  addMonths,
} from "date-fns";

export type RecurringEvent = {
  _id: string;
  startTime: number;
  endTime: number;
  isRecurring?: boolean;
  recurrenceType?: "daily" | "weekly" | "monthly";
  recurrenceCount?: number; // interval (every N days/weeks/months)
  daysOfWeek?: number[]; // 0=Sun..6=Sat for weekly
  recurrenceEndDate?: number; // optional end date timestamp
};

/**
 * Determines if a recurring event should appear on a given day.
 * For non-recurring events, only shows on the exact date.
 */
export function isEventOnDay(event: RecurringEvent, date: Date): boolean {
  const eventStartDate = new Date(event.startTime);
  const normalizedDate = startOfDay(date);
  const normalizedEventDate = startOfDay(eventStartDate);

  // If date is before the event start date, don't show
  if (isBefore(normalizedDate, normalizedEventDate)) {
    return false;
  }

  // Check if past the recurrence end date
  if (event.recurrenceEndDate) {
    const endDate = startOfDay(new Date(event.recurrenceEndDate));
    if (isBefore(endDate, normalizedDate)) {
      return false;
    }
  }

  // Non-recurring events: only show on exact date
  if (!event.isRecurring) {
    return isSameDay(normalizedDate, normalizedEventDate);
  }

  // Recurring events
  const daysDiff = differenceInDays(normalizedDate, normalizedEventDate);
  const interval = event.recurrenceCount || 1;

  switch (event.recurrenceType) {
    case "daily":
      // Show every `interval` days
      return daysDiff % interval === 0;

    case "weekly": {
      const weeksDiff = differenceInWeeks(normalizedDate, normalizedEventDate);

      // Check if we're on the right interval week
      if (weeksDiff % interval !== 0) {
        return false;
      }

      // Check daysOfWeek array if present
      if (event.daysOfWeek && event.daysOfWeek.length > 0) {
        return event.daysOfWeek.includes(getDay(normalizedDate));
      }

      // Fallback: Use the same day of week as the start date
      return getDay(normalizedEventDate) === getDay(normalizedDate);
    }

    case "monthly": {
      const monthsDiff = differenceInMonths(normalizedDate, normalizedEventDate);

      if (monthsDiff % interval !== 0) {
        return false;
      }

      // Check if it's the same day of month
      return normalizedDate.getDate() === normalizedEventDate.getDate();
    }

    default:
      // For recurring events without a specific type, treat as daily
      return true;
  }
}

/**
 * Expands recurring events into individual instances within a date range.
 * Returns expanded instances with calculated start/end times preserving duration.
 */
export function expandRecurringEvents<
  T extends RecurringEvent & { [key: string]: unknown }
>(
  events: T[],
  rangeStart: Date,
  rangeEnd: Date
): Array<T & { instanceDate: number; originalEventId: string }> {
  const expandedEvents: Array<T & { instanceDate: number; originalEventId: string }> = [];

  for (const event of events) {
    if (!event.isRecurring) {
      // Non-recurring: include if within range
      const eventStart = new Date(event.startTime);
      if (eventStart >= rangeStart && eventStart <= rangeEnd) {
        expandedEvents.push({
          ...event,
          instanceDate: event.startTime,
          originalEventId: event._id,
        });
      }
      continue;
    }

    // Recurring event: expand instances within range
    const eventStartDate = new Date(event.startTime);
    const eventEndDate = new Date(event.endTime);
    const duration = event.endTime - event.startTime;

    // Determine the end of expansion (either range end or recurrence end)
    let expansionEnd = rangeEnd;
    if (event.recurrenceEndDate) {
      const recurrenceEnd = new Date(event.recurrenceEndDate);
      if (recurrenceEnd < rangeEnd) {
        expansionEnd = recurrenceEnd;
      }
    }

    // Start iteration from the event start or range start, whichever is later
    let currentDate = startOfDay(
      eventStartDate < rangeStart ? rangeStart : eventStartDate
    );
    const maxIterations = 400; // Safety limit
    let iterations = 0;

    while (currentDate <= expansionEnd && iterations < maxIterations) {
      iterations++;

      if (isEventOnDay(event, currentDate)) {
        // Calculate instance times preserving original time of day
        const instanceStart = new Date(currentDate);
        instanceStart.setHours(
          eventStartDate.getHours(),
          eventStartDate.getMinutes(),
          eventStartDate.getSeconds(),
          eventStartDate.getMilliseconds()
        );

        // Only include if the instance start is within our query range
        if (instanceStart >= rangeStart && instanceStart <= rangeEnd) {
          const instanceEnd = new Date(instanceStart.getTime() + duration);

          expandedEvents.push({
            ...event,
            startTime: instanceStart.getTime(),
            endTime: instanceEnd.getTime(),
            instanceDate: instanceStart.getTime(),
            originalEventId: event._id,
          });
        }
      }

      currentDate = addDays(currentDate, 1);
    }
  }

  // Sort by start time
  expandedEvents.sort((a, b) => a.startTime - b.startTime);

  return expandedEvents;
}
