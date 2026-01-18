"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export type Invitation = {
  _id: Id<"invitations">;
  familyId: Id<"families">;
  email: string;
  invitedBy: Id<"users">;
  token: string;
  status: "pending" | "accepted" | "cancelled";
  createdAt: number;
  expiresAt: number;
  acceptedAt?: number;
  acceptedBy?: Id<"users">;
};

export type InvitationDetails = {
  _id: Id<"invitations">;
  familyId: Id<"families">;
  familyName: string;
  inviterName: string;
  email: string;
  status: "pending" | "accepted" | "cancelled";
  createdAt: number;
  expiresAt: number;
  isExpired: boolean;
};

export function useInvitations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingInvitations = useQuery(api.invitations.getPendingInvitations);
  const createInvitationMutation = useMutation(api.invitations.createInvitation);
  const cancelInvitationMutation = useMutation(api.invitations.cancelInvitation);

  const createInvitation = useCallback(
    async (email: string): Promise<{ token: string } | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await createInvitationMutation({ email });
        return { token: result.token };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create invitation";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [createInvitationMutation]
  );

  const cancelInvitation = useCallback(
    async (invitationId: Id<"invitations">): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await cancelInvitationMutation({ invitationId });
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to cancel invitation";
        setError(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [cancelInvitationMutation]
  );

  return {
    pendingInvitations: pendingInvitations ?? [],
    loading: loading || pendingInvitations === undefined,
    error,
    createInvitation,
    cancelInvitation,
  };
}

export function useInvitationByToken(token: string | null) {
  const invitation = useQuery(
    api.invitations.getInvitationByToken,
    token ? { token } : "skip"
  );

  return {
    invitation: invitation ?? null,
    loading: token !== null && invitation === undefined,
  };
}

export function useAcceptInvitation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptInvitationMutation = useMutation(api.invitations.acceptInvitation);

  const acceptInvitation = useCallback(
    async (token: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await acceptInvitationMutation({ token });
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to accept invitation";
        setError(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [acceptInvitationMutation]
  );

  return {
    acceptInvitation,
    loading,
    error,
  };
}
