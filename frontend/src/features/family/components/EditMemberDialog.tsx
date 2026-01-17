"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FamilyMember } from "@/hooks/useFamilyMembers";

type EditMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: FamilyMember | null;
  onSave: (userId: string, data: {
    name?: string;
    profileImageUrl?: string | null;
    iconEmoji?: string | null;
  }) => Promise<void>;
  loading?: boolean;
};

export function EditMemberDialog({
  open,
  onOpenChange,
  member,
  onSave,
  loading = false,
}: EditMemberDialogProps) {
  // Form state
  const [name, setName] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [iconEmoji, setIconEmoji] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset form when dialog opens or member changes
  useEffect(() => {
    if (open && member) {
      setName(member.name);
      setProfileImageUrl(member.profileImageUrl || "");
      setIconEmoji(member.iconEmoji || "");
    }
  }, [open, member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !name.trim()) return;

    setSaving(true);
    try {
      await onSave(member._id, {
        name: name.trim(),
        profileImageUrl: profileImageUrl.trim() || null,
        iconEmoji: iconEmoji.trim() || null,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Family Member</DialogTitle>
          <DialogDescription>
            Update {member.name}&apos;s profile information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Profile Image URL */}
            <div className="grid gap-2">
              <label htmlFor="profileImageUrl" className="text-sm font-medium">
                Profile Image URL (optional)
              </label>
              <Input
                id="profileImageUrl"
                placeholder="https://example.com/avatar.jpg"
                value={profileImageUrl}
                onChange={(e) => setProfileImageUrl(e.target.value)}
              />
            </div>

            {/* Icon Emoji */}
            <div className="grid gap-2">
              <label htmlFor="iconEmoji" className="text-sm font-medium">
                Icon Emoji (optional)
              </label>
              <Input
                id="iconEmoji"
                placeholder="😊"
                value={iconEmoji}
                onChange={(e) => setIconEmoji(e.target.value)}
                maxLength={2}
              />
            </div>

            {/* Read-only fields */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">Role</label>
              <Input
                value={member.role === "parent" ? "Parent" : "Child"}
                disabled
                className="bg-muted"
              />
            </div>

            {member.email && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={member.email}
                  disabled
                  className="bg-muted"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || loading || !name.trim()}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}