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
import { Check, Copy, Mail } from "lucide-react";
import { useInvitations } from "@/hooks/useInvitations";

type InviteParentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InviteParentDialog({
  open,
  onOpenChange,
}: InviteParentDialogProps) {
  const [email, setEmail] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { createInvitation, loading, error } = useInvitations();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setEmail("");
      setInviteLink(null);
      setCopied(false);
      setLocalError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim()) {
      setLocalError("Please enter an email address");
      return;
    }

    const result = await createInvitation(email.trim());
    if (result) {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      setInviteLink(`${baseUrl}/auth/invite?token=${result.token}`);
    }
  };

  const handleCopy = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const displayError = localError || error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="size-5" />
            Invite Parent
          </DialogTitle>
          <DialogDescription>
            {inviteLink
              ? "Share this link with the person you want to invite."
              : "Enter the email address of the parent you want to invite to your family."}
          </DialogDescription>
        </DialogHeader>

        {!inviteLink ? (
          <form onSubmit={handleSubmit}>
            {displayError && (
              <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {displayError}
              </div>
            )}

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="parent@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  This email is used to track who was invited. They will sign up with their own account.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !email.trim()}>
                {loading ? "Creating..." : "Create Invite"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-md bg-muted/50 border border-muted">
              <p className="text-sm font-medium mb-2">Invitation Link</p>
              <div className="flex gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="size-4 text-green-600" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This link expires in 7 days. Share it with the person you want to invite.
              </p>
            </div>

            <div className="p-3 rounded-md bg-primary/10 border border-primary/20 text-sm">
              <p className="font-medium text-primary">Invitation sent to: {email}</p>
              <p className="text-muted-foreground mt-1">
                When they click the link and sign up, they will automatically join your family as a parent.
              </p>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
