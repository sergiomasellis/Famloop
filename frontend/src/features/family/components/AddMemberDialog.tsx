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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AddMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyId: string;
  onSave: (data: {
    name: string;
    email?: string;
    password?: string;
    role: "parent" | "child";
    family_id?: string;
  }) => Promise<void>;
  loading?: boolean;
};

export function AddMemberDialog({
  open,
  onOpenChange,
  familyId,
  onSave,
  loading = false,
}: AddMemberDialogProps) {
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"parent" | "child">("child");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setPassword("");
      setRole("child");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    // Validate required fields based on role
    if (role === "parent") {
      if (!email.trim()) {
        setError("Email is required for parents");
        return;
      }
      if (!password.trim()) {
        setError("Password is required for parents");
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      // onSave will handle creating a family if needed
      await onSave({
        name: name.trim(),
        email: role === "parent" ? email.trim() : undefined,
        password: role === "parent" ? password.trim() : undefined,
        role,
        family_id: familyId || undefined, // Will be handled by parent
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add family member");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add Family Member</DialogTitle>
          <DialogDescription>
            Add a new family member. They can be either a parent or child.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}
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

            {/* Email - only for parents */}
            {role === "parent" && (
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email <span className="text-destructive">*</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Password - only for parents */}
            {role === "parent" && (
              <div className="grid gap-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password <span className="text-destructive">*</span>
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 6 characters
                </p>
              </div>
            )}

            {/* Info message for children */}
            {role === "child" && (
              <div className="p-3 rounded-md bg-muted/50 border border-muted text-sm text-muted-foreground">
                <p>Children don&apos;t need email or password since only parents can sign in to the service.</p>
              </div>
            )}

            {/* Role */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={role} onValueChange={(value: "parent" | "child") => setRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="child">Child</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={
                saving || 
                loading || 
                !name.trim() || 
                (role === "parent" && (!email.trim() || !password.trim()))
              }
            >
              {saving ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}