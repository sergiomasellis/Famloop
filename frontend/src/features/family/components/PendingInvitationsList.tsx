"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, X, Clock, Mail } from "lucide-react";
import { useInvitations, Invitation } from "@/hooks/useInvitations";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { Id } from "../../../../convex/_generated/dataModel";

export function PendingInvitationsList() {
  const { pendingInvitations, loading, cancelInvitation } = useInvitations();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCopyLink = async (token: string, invitationId: string) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const link = `${baseUrl}/auth/invite?token=${token}`;

    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(invitationId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCancel = async (invitationId: Id<"invitations">) => {
    setCancellingId(invitationId);
    await cancelInvitation(invitationId);
    setCancellingId(null);
  };

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Loading invitations...</p>
    );
  }

  if (pendingInvitations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No pending invitations.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {pendingInvitations.map((invitation: Invitation) => {
        const daysUntilExpiry = differenceInDays(
          invitation.expiresAt,
          Date.now()
        );
        const isExpiringSoon = daysUntilExpiry <= 2;

        return (
          <div
            key={invitation._id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-md bg-muted">
                <Mail className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{invitation.email}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    Sent {formatDistanceToNow(invitation.createdAt, { addSuffix: true })}
                  </span>
                  <span className="text-muted-foreground/50">|</span>
                  <span className={isExpiringSoon ? "text-amber-600" : ""}>
                    <Clock className="inline size-3 mr-1" />
                    {daysUntilExpiry > 0
                      ? `Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""}`
                      : "Expires today"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyLink(invitation.token, invitation._id)}
                className="flex-1 sm:flex-initial"
              >
                {copiedId === invitation._id ? (
                  <>
                    <Check className="mr-2 size-4 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 size-4" />
                    Copy Link
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCancel(invitation._id)}
                disabled={cancellingId === invitation._id}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <X className="mr-2 size-4" />
                {cancellingId === invitation._id ? "..." : "Cancel"}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
