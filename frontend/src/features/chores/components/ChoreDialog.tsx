"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Chore, ChoreCreate, ChoreUpdate } from "@/hooks/useChores";
import { FamilyMember } from "@/hooks/useFamilyMembers";
import { Id } from "../../../../convex/_generated/dataModel";
import { getWeekStart } from "@/lib/date";
import { format } from "date-fns";
import { Repeat, Star, Users, Calendar, ChevronDown, Sparkles, Check, Users2, User, ChevronLeft, ChevronRight } from "lucide-react";

// Common emojis for chores - grouped by category
const CHORE_EMOJI_GROUPS = [
  { label: "Cleaning", emojis: ["🧹", "🧺", "🧽", "🧴", "🚿", "🛁"] },
  { label: "Kitchen", emojis: ["🍽️", "🥣", "🍳", "🧊", "🗑️", "🫧"] },
  { label: "Pets", emojis: ["🐶", "🐱", "🐠", "🐹", "🦜", "🐰"] },
  { label: "Outdoors", emojis: ["🌱", "🌻", "🍂", "🚗", "🏠", "📬"] },
  { label: "Personal", emojis: ["🛏️", "👕", "🪥", "📚", "🎒", "💤"] },
  { label: "Other", emojis: ["📝", "✅", "🎮", "🧸", "🎨", "💪"] },
];

type ChoreDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chore?: Chore | null;
  familyMembers: FamilyMember[];
  familyId: Id<"families">;
  onSave: (data: ChoreCreate | ChoreUpdate, choreId?: Id<"chores">) => Promise<void>;
};

export function ChoreDialog({
  open,
  onOpenChange,
  chore,
  familyMembers,
  familyId,
  onSave,
}: ChoreDialogProps) {
  const isEditing = !!chore;

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("🧹");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [pointValue, setPointValue] = useState(5);
  const [assignedToIds, setAssignedToIds] = useState<Id<"users">[]>([]);
  const [weekStart, setWeekStart] = useState(() =>
    getWeekStart(new Date()).getTime()
  );
  const [saving, setSaving] = useState(false);

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Group vs Individual chore
  const [isGroupChore, setIsGroupChore] = useState(true);

  // Recurring state (simplified for Convex)
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [recurrenceCount, setRecurrenceCount] = useState(1);
  const [selectedDays, setSelectedDays] = useState<number[]>(() => [new Date().getDay()]);
  const [maxCompletions, setMaxCompletions] = useState<number | undefined>(undefined);

  // Reset form and step when dialog opens or chore changes
  useEffect(() => {
    if (open) {
      setCurrentStep(1); // Reset to first step
      if (chore) {
        setTitle(chore.title);
        setDescription(chore.description || "");
        setEmoji(chore.emoji || "🧹");
        setPointValue(chore.pointValue);
        setAssignedToIds(chore.assignedToIds || []);
        setIsGroupChore(chore.isGroupChore !== false);
        setWeekStart(chore.weekStart);
        setIsRecurring(chore.isRecurring || false);
        setRecurrenceType(chore.recurrenceType || "weekly");
        setRecurrenceCount(chore.recurrenceCount || 1);
        setSelectedDays(chore.daysOfWeek || [new Date(chore.weekStart).getDay()]);
        setMaxCompletions(chore.maxCompletions);
      } else {
        setTitle("");
        setDescription("");
        setEmoji("🧹");
        setPointValue(5);
        setAssignedToIds([]);
        setIsGroupChore(true);
        setWeekStart(getWeekStart(new Date()).getTime());
        setIsRecurring(false);
        setRecurrenceType("weekly");
        setRecurrenceCount(1);
        setSelectedDays([new Date().getDay()]);
        setMaxCompletions(undefined);
      }
    }
  }, [open, chore]);

  const handleAssigneeToggle = (memberId: Id<"users">) => {
    setAssignedToIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Validation for current step
    if (currentStep === 1 && !title.trim()) {
      return; // Can't proceed without title
    }
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only submit on the final step
    if (currentStep !== totalSteps) {
      return;
    }

    if (!title.trim()) return;

    setSaving(true);
    try {
      if (isEditing && chore) {
        const updates: ChoreUpdate = {
          title: title.trim(),
          description: description.trim() || undefined,
          emoji,
          pointValue,
          assignedToIds: assignedToIds.length > 0 ? assignedToIds : undefined,
          isGroupChore,
          isRecurring,
          recurrenceType: isRecurring ? recurrenceType : undefined,
          recurrenceCount: isRecurring ? recurrenceCount : undefined,
          daysOfWeek: isRecurring && recurrenceType === "weekly" ? selectedDays : undefined,
          maxCompletions: isRecurring ? maxCompletions : undefined,
        };
        await onSave(updates, chore._id);
      } else {
        const newChore: ChoreCreate = {
          title: title.trim(),
          description: description.trim() || undefined,
          emoji,
          pointValue,
          assignedToIds: assignedToIds.length > 0 ? assignedToIds : undefined,
          isGroupChore,
          weekStart,
          isRecurring,
          recurrenceType: isRecurring ? recurrenceType : undefined,
          recurrenceCount: isRecurring ? recurrenceCount : undefined,
          daysOfWeek: isRecurring && recurrenceType === "weekly" ? selectedDays : undefined,
          maxCompletions: isRecurring ? maxCompletions : undefined,
        };
        await onSave(newChore);
      }
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-2 border-border shadow-[8px_8px_0px_0px_var(--shadow-color)]">
        <DialogHeader className="border-b-2 border-border pb-4">
          <DialogTitle className="font-black uppercase tracking-tight flex items-center gap-2">
            <span className="text-2xl">{emoji}</span>
            {isEditing ? "Edit Chore" : "New Chore"}
          </DialogTitle>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-2">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  idx + 1 <= currentStep
                    ? "bg-primary"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Step {currentStep} of {totalSteps}:{" "}
            {currentStep === 1
              ? "Basic Info"
              : currentStep === 2
              ? "Assignment"
              : "Schedule"}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase">
                  Chore Name <span className="text-destructive">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Clean room"
                  className="border-2 border-border focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              {/* Emoji Picker */}
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase">Emoji</label>
                <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between border-2 border-border hover:bg-muted"
                    >
                      <span className="text-xl">{emoji}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow-color)]">
                    <div className="space-y-3">
                      {CHORE_EMOJI_GROUPS.map((group) => (
                        <div key={group.label}>
                          <p className="text-xs font-bold text-muted-foreground mb-1">
                            {group.label}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {group.emojis.map((e) => (
                              <button
                                key={e}
                                type="button"
                                onClick={() => {
                                  setEmoji(e);
                                  setEmojiPickerOpen(false);
                                }}
                                className={`p-2 text-xl rounded hover:bg-muted transition-colors ${
                                  emoji === e ? "bg-muted ring-2 ring-primary" : ""
                                }`}
                              >
                                {e}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase">
                  Description (optional)
                </label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Vacuum and dust"
                  className="border-2 border-border"
                />
              </div>

              {/* Points */}
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Points
                </label>
                <Input
                  type="number"
                  value={pointValue}
                  onChange={(e) => setPointValue(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  className="border-2 border-border"
                />
              </div>
            </div>
          )}

          {/* Step 2: Assignment */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Group vs Individual */}
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Chore Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={isGroupChore ? "default" : "outline"}
                    onClick={() => setIsGroupChore(true)}
                    className="border-2 border-border"
                  >
                    <Users2 className="mr-2 h-4 w-4" />
                    Group
                  </Button>
                  <Button
                    type="button"
                    variant={!isGroupChore ? "default" : "outline"}
                    onClick={() => setIsGroupChore(false)}
                    className="border-2 border-border"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Individual
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isGroupChore
                    ? "One person completes it for everyone"
                    : "Each person needs to complete it"}
                </p>
              </div>

              {/* Assignees */}
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase">Assign To</label>
                <div className="grid grid-cols-2 gap-2">
                  {familyMembers.map((member) => (
                    <Button
                      key={member._id}
                      type="button"
                      variant={assignedToIds.includes(member._id) ? "default" : "outline"}
                      onClick={() => handleAssigneeToggle(member._id)}
                      className="justify-start border-2 border-border"
                    >
                      {assignedToIds.includes(member._id) && (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      {member.iconEmoji && <span className="mr-2">{member.iconEmoji}</span>}
                      {member.name}
                    </Button>
                  ))}
                </div>
                {assignedToIds.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No one assigned - anyone can complete it
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Schedule */}
          {currentStep === 3 && (
            <div className="space-y-4">
              {/* Recurring toggle */}
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase flex items-center gap-2">
                  <Repeat className="h-4 w-4" />
                  Recurring Chore
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={!isRecurring ? "default" : "outline"}
                    onClick={() => setIsRecurring(false)}
                    className="border-2 border-border"
                  >
                    One Time
                  </Button>
                  <Button
                    type="button"
                    variant={isRecurring ? "default" : "outline"}
                    onClick={() => setIsRecurring(true)}
                    className="border-2 border-border"
                  >
                    <Repeat className="mr-2 h-4 w-4" />
                    Recurring
                  </Button>
                </div>
              </div>

              {isRecurring && (
                <>
                  {/* Recurrence Type */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase">Repeat</label>
                    <Select
                      value={recurrenceType}
                      onValueChange={(v) => setRecurrenceType(v as typeof recurrenceType)}
                    >
                      <SelectTrigger className="border-2 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Day of Week Selector (for weekly) */}
                  {recurrenceType === "weekly" && (
                    <div className="space-y-2">
                      <label className="text-sm font-bold uppercase">On These Days</label>
                      <div className="flex gap-1">
                        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                          <Button
                            key={index}
                            type="button"
                            variant={selectedDays.includes(index) ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              if (selectedDays.includes(index)) {
                                // Don't allow deselecting if it's the last day
                                if (selectedDays.length > 1) {
                                  setSelectedDays(selectedDays.filter((d) => d !== index));
                                }
                              } else {
                                setSelectedDays([...selectedDays, index].sort());
                              }
                            }}
                            className="w-9 h-9 p-0 border-2 border-border font-bold"
                          >
                            {day}
                          </Button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Select which days of the week this chore repeats
                      </p>
                    </div>
                  )}

                  {/* Max Completions per day */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase">
                      Max Completions per Day
                    </label>
                    <Input
                      type="number"
                      value={maxCompletions || ""}
                      onChange={(e) => setMaxCompletions(e.target.value ? parseInt(e.target.value) : undefined)}
                      min={1}
                      placeholder="Unlimited"
                      className="border-2 border-border"
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty for unlimited
                    </p>
                  </div>
                </>
              )}

              {/* Week Start (for non-recurring) */}
              {!isRecurring && !isEditing && (
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Week Starting
                  </label>
                  <Input
                    type="date"
                    value={format(new Date(weekStart), "yyyy-MM-dd")}
                    onChange={(e) => setWeekStart(new Date(e.target.value).getTime())}
                    className="border-2 border-border"
                  />
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t-2 border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="border-2 border-border"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={currentStep === 1 && !title.trim()}
                className="border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow-color)]"
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={saving || !title.trim()}
                className="border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow-color)]"
              >
                {saving ? (
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                {isEditing ? "Save Changes" : "Create Chore"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
