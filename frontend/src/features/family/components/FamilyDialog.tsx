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
import { Family } from "@/hooks/useFamilies";
import { Users, KeyRound } from "lucide-react";

type FamilyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  family?: Family | null;
  onSave: (data: { name: string; adminPin?: string }, familyId?: string) => Promise<void>;
};

export function FamilyDialog({
  open,
  onOpenChange,
  family,
  onSave,
}: FamilyDialogProps) {
  const isEditing = !!family;

  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (family) {
        setName(family.name);
        setPin("");
        setConfirmPin("");
      } else {
        setName("");
        setPin("");
        setConfirmPin("");
      }
      setError(null);
    }
  }, [open, family]);

  // Handle PIN input - only allow digits and limit to 6
  const handlePinChange = (value: string, setter: (v: string) => void) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 6);
    setter(digitsOnly);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Family name is required");
      return;
    }

    // For new families, PIN is required
    if (!isEditing && !pin) {
      setError("Parent PIN is required");
      return;
    }

    // Validate PIN format (4-6 digits)
    if (pin && (pin.length < 4 || pin.length > 6)) {
      setError("PIN must be 4-6 digits");
      return;
    }

    // Confirm PIN match
    if (pin && pin !== confirmPin) {
      setError("PINs do not match");
      return;
    }

    setSaving(true);
    try {
      const data: { name: string; adminPin?: string } = { name: name.trim() };
      if (pin) {
        data.adminPin = pin;
      }
      await onSave(data, family?._id);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save family");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {isEditing ? "Edit Family" : "Create New Family"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the family name and optionally change the parent PIN."
              : "Create a new family group. You'll set a parent PIN to protect settings."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Family Name */}
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Family Name
              </label>
              <Input
                id="name"
                placeholder="The Smith Family"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Parent PIN */}
            <div className="grid gap-2">
              <label htmlFor="adminPin" className="text-sm font-medium flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                {isEditing ? "New Parent PIN (optional)" : "Parent PIN"}
              </label>
              <Input
                id="adminPin"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={isEditing ? "Leave empty to keep current PIN" : "4-6 digit PIN"}
                value={pin}
                onChange={(e) => handlePinChange(e.target.value, setPin)}
                required={!isEditing}
                maxLength={6}
                className="font-mono text-lg tracking-[0.5em] text-center"
              />
              {isEditing ? (
                <p className="text-xs text-muted-foreground">
                  Only fill this if you want to change the parent PIN
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  This PIN protects parent-only features like settings.
                </p>
              )}
            </div>

            {/* Confirm PIN (only if PIN is provided or creating new family) */}
            {(pin || !isEditing) && (
              <div className="grid gap-2">
                <label htmlFor="confirmPin" className="text-sm font-medium">
                  Confirm PIN
                </label>
                <Input
                  id="confirmPin"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Re-enter PIN"
                  value={confirmPin}
                  onChange={(e) => handlePinChange(e.target.value, setConfirmPin)}
                  required={!isEditing || !!pin}
                  maxLength={6}
                  className="font-mono text-lg tracking-[0.5em] text-center"
                />
              </div>
            )}

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
                {error}
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
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Family"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

