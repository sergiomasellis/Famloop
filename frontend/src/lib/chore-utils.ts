import { Chore } from "@/hooks/useChores";
import { isSameDay, getDay, differenceInDays, differenceInWeeks, differenceInMonths, isBefore, startOfDay, startOfWeek } from "date-fns";

/**
 * Determines if a chore should be displayed on a given day.
 * Handles both one-time and recurring chores.
 *
 * Note: weekStart is a timestamp in Convex (number), not an ISO string
 */
export function isChoreOnDay(chore: Chore, date: Date): boolean {
  // Convert weekStart timestamp to Date
  const choreDate = new Date(chore.weekStart);

  // Normalize dates to start of day for comparison
  const normalizedDate = startOfDay(date);
  const normalizedChoreDate = startOfDay(choreDate);

  // If date is before the chore start date, don't show
  if (isBefore(normalizedDate, normalizedChoreDate)) {
    return false;
  }

  // Non-recurring chores: show for the entire week starting from weekStart
  if (!chore.isRecurring) {
    // Check if the date is within the same week as the chore
    const choreWeekStart = startOfWeek(normalizedChoreDate, { weekStartsOn: 0 });
    const dateWeekStart = startOfWeek(normalizedDate, { weekStartsOn: 0 });
    return isSameDay(choreWeekStart, dateWeekStart);
  }

  // Recurring chores
  const daysDiff = differenceInDays(normalizedDate, normalizedChoreDate);
  const interval = chore.recurrenceCount || 1;

  switch (chore.recurrenceType) {
    case "daily":
      // Show every `interval` days
      return daysDiff % interval === 0;

    case "weekly": {
      // Check if the day of week matches the original chore day
      const weeksDiff = differenceInWeeks(normalizedDate, normalizedChoreDate);

      // Check if we're on the right interval week
      if (weeksDiff % interval !== 0) {
        return false;
      }

      // Check daysOfWeek array if present
      if (chore.daysOfWeek && chore.daysOfWeek.length > 0) {
        return chore.daysOfWeek.includes(getDay(normalizedDate));
      }

      // Fallback: Use the same day of week as the start date
      return getDay(normalizedChoreDate) === getDay(normalizedDate);
    }

    case "monthly": {
      // Show on the same day of month, every `interval` months
      const monthsDiff = differenceInMonths(normalizedDate, normalizedChoreDate);

      if (monthsDiff % interval !== 0) {
        return false;
      }

      // Check if it's the same day of month
      return normalizedDate.getDate() === normalizedChoreDate.getDate();
    }

    default:
      // For recurring chores without a specific type, show every day
      return true;
  }
}
