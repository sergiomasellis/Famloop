export type EventParticipant = {
  id: string;
  name: string;
};

export type EventItem = {
  id: string;
  title: string;
  emoji: string;
  description?: string;
  start: Date;
  end: Date;
  participants?: EventParticipant[];
  // Recurrence fields
  isRecurring?: boolean;
  recurrenceType?: "daily" | "weekly" | "monthly";
  recurrenceCount?: number;
  daysOfWeek?: number[];
  recurrenceEndDate?: Date;
  // For recurring instances
  instanceDate?: Date;
  originalEventId?: string;
};

// API-aligned Event type (from backend)
export type Event = {
  id: number;
  family_id: number;
  title: string;
  description?: string | null;
  emoji?: string | null;
  start_time: string; // ISO datetime string
  end_time: string; // ISO datetime string
  source?: "ical" | "google" | "alexa" | "manual" | null;
  source_id?: string | null;
  created_at: string; // ISO datetime string
};

export type EventCreate = {
  family_id: number;
  title: string;
  description?: string | null;
  emoji?: string | null;
  start_time: string; // ISO datetime string
  end_time: string; // ISO datetime string
  source?: "ical" | "google" | "alexa" | "manual" | null;
  source_id?: string | null;
};

export type EventUpdate = {
  title?: string;
  description?: string | null;
  emoji?: string | null;
  start_time?: string; // ISO datetime string
  end_time?: string; // ISO datetime string
};

// Legacy ChoreItem type (used in demo data)
export type ChoreItem = {
  id: string;
  title: string;
  emoji: string;
  points: number;
  assignedTo: string;
  completed: boolean;
  start: Date;
  end: Date;
};

// API-aligned Chore type
export type Chore = {
  id: number;
  family_id: number;
  title: string;
  description?: string | null;
  emoji?: string | null;
  point_value: number;
  assigned_to?: number | null; // Legacy single assignee
  assigned_to_ids?: string | null; // Comma-separated user IDs for multiple assignees
  is_group_chore?: boolean; // True = one completion for all, False = each person completes individually
  completed: boolean;
  completed_by_ids?: string | null; // For individual chores: who has completed (comma-separated)
  week_start: string; // ISO date string (YYYY-MM-DD)
  created_at: string; // ISO datetime string
  // Recurring fields
  is_recurring?: boolean;
  recurrence_type?: "daily" | "weekly" | "monthly" | null;
  recurrence_interval?: number | null;
  recurrence_count?: number | null;
  recurrence_days?: string | null; // comma-separated days of week (0-6)
  recurrence_time_of_day?: "morning" | "afternoon" | "evening" | "anytime" | null;
  recurrence_end_date?: string | null; // ISO date string
  parent_chore_id?: number | null;
  max_completions?: number | null; // Max times this recurring chore can be completed
  completed_today?: boolean; // Computed by backend
};

export type ChoreCreate = {
  family_id: number;
  title: string;
  description?: string | null;
  emoji?: string | null;
  point_value: number;
  assigned_to?: number | null;
  assigned_to_ids?: string | null;
  is_group_chore?: boolean;
  completed?: boolean;
  completed_by_ids?: string | null;
  week_start: string;
  // Recurring fields
  is_recurring?: boolean;
  recurrence_type?: "daily" | "weekly" | "monthly" | null;
  recurrence_interval?: number | null;
  recurrence_count?: number | null;
  recurrence_days?: string | null;
  recurrence_time_of_day?: "morning" | "afternoon" | "evening" | "anytime" | null;
  recurrence_end_date?: string | null;
  parent_chore_id?: number | null;
  max_completions?: number | null;
};

export type ChoreUpdate = {
  title?: string;
  description?: string | null;
  emoji?: string | null;
  point_value?: number;
  assigned_to?: number | null;
  assigned_to_ids?: string | null;
  is_group_chore?: boolean;
  completed?: boolean;
  completed_by_ids?: string | null;
  // Recurring fields
  is_recurring?: boolean;
  recurrence_type?: "daily" | "weekly" | "monthly" | null;
  recurrence_interval?: number | null;
  recurrence_count?: number | null;
  recurrence_days?: string | null;
  recurrence_time_of_day?: "morning" | "afternoon" | "evening" | "anytime" | null;
  recurrence_end_date?: string | null;
  parent_chore_id?: number | null;
  max_completions?: number | null;
};

// Family type (Convex-compatible)
export type Family = {
  _id: string;
  name: string;
  createdAt: number;
  adminPasswordHash?: string;
  // Legacy aliases for backwards compatibility
  id?: number;
  created_at?: string;
};

// Family member type for assignment (Convex-compatible)
export type FamilyMember = {
  _id: string;
  clerkId?: string;
  name: string;
  email?: string | null;
  role: "parent" | "child";
  profileImageUrl?: string | null;
  iconEmoji?: string | null;
  familyId?: string | null;
  createdAt?: number;
  // Legacy aliases for backwards compatibility
  id?: number;
  profile_image_url?: string | null;
  icon_emoji?: string | null;
  family_id?: number | null;
  created_at?: string;
};

export type CalendarView = "week" | "day" | "month" | "task";

export type DragState = {
  id: string;
  startMinutes: number;
  durationMinutes: number;
  dayOffset: number;
  initialClientX: number;
  initialClientY: number;
  columnWidth: number;
} | null;

export type HoverPreview = {
  date: Date;
  topPx: number;
  heightPx: number;
  key: string;
} | null;

// Chore Completion types
export type ChoreCompletion = {
  id: number;
  user_id: number;
  user_name: string;
  user_emoji?: string | null;
  completed_at: string; // ISO datetime string
  points_awarded: number;
};

// Leaderboard types
export type CompletedChore = {
  id: number;
  title: string;
  emoji?: string | null;
  point_value: number;
  awarded_at: string; // ISO datetime string
};

export type LeaderboardEntry = {
  user_id: number;
  name: string;
  icon_emoji?: string | null;
  total_points: number;
  completed_chores: CompletedChore[];
};
