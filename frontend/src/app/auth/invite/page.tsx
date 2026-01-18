"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, AlertCircle, CheckCircle, Clock, LogIn, UserPlus } from "lucide-react";
import { useInvitationByToken, useAcceptInvitation } from "@/hooks/useInvitations";
import { useAuth } from "@/contexts/AuthContext";

function InvitePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { user: convexUser } = useAuth();
  const { invitation, loading: invitationLoading } = useInvitationByToken(token);
  const { acceptInvitation, loading: accepting, error: acceptError } = useAcceptInvitation();

  const [accepted, setAccepted] = useState(false);
  const [showFamilyWarning, setShowFamilyWarning] = useState(false);

  // Check if user already has a family
  const hasExistingFamily = convexUser?.familyId !== undefined;

  // Build redirect URL for auth pages
  const redirectUrl = token ? `/auth/invite?token=${token}` : "/auth/invite";

  const handleAccept = async () => {
    if (!token) return;

    // If user has existing family, show warning first
    if (hasExistingFamily && !showFamilyWarning) {
      setShowFamilyWarning(true);
      return;
    }

    const success = await acceptInvitation(token);
    if (success) {
      setAccepted(true);
      // Redirect to calendar after a short delay
      setTimeout(() => {
        router.push("/calendar");
      }, 2000);
    }
  };

  // No token provided
  if (!token) {
    return (
      <div className="w-full max-w-md">
        <Card className="border-4 border-border shadow-[8px_8px_0px_0px_var(--shadow-color)]">
          <CardHeader className="border-b-4 border-border bg-destructive/20">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="size-6" />
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-muted-foreground">
              No invitation token was provided. Please check your invitation link and try again.
            </p>
            <Button asChild className="w-full">
              <Link href="/">Go to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading states
  if (!clerkLoaded || invitationLoading) {
    return (
      <div className="w-full max-w-md">
        <Card className="border-4 border-border shadow-[8px_8px_0px_0px_var(--shadow-color)]">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
              <p className="text-muted-foreground">Loading invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invitation not found or invalid
  if (!invitation) {
    return (
      <div className="w-full max-w-md">
        <Card className="border-4 border-border shadow-[8px_8px_0px_0px_var(--shadow-color)]">
          <CardHeader className="border-b-4 border-border bg-destructive/20">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="size-6" />
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-muted-foreground">
              This invitation link is not valid. It may have been cancelled or the link is incorrect.
            </p>
            <Button asChild className="w-full">
              <Link href="/">Go to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invitation expired
  if (invitation.isExpired) {
    return (
      <div className="w-full max-w-md">
        <Card className="border-4 border-border shadow-[8px_8px_0px_0px_var(--shadow-color)]">
          <CardHeader className="border-b-4 border-border bg-amber-500/20">
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-6" />
              Invitation Expired
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-muted-foreground">
              This invitation has expired. Please ask <strong>{invitation.inviterName}</strong> to send you a new invitation.
            </p>
            <Button asChild className="w-full">
              <Link href="/">Go to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invitation already accepted
  if (invitation.status === "accepted") {
    return (
      <div className="w-full max-w-md">
        <Card className="border-4 border-border shadow-[8px_8px_0px_0px_var(--shadow-color)]">
          <CardHeader className="border-b-4 border-border bg-muted">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="size-6" />
              Already Accepted
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-muted-foreground">
              This invitation has already been accepted.
            </p>
            <Button asChild className="w-full">
              <Link href="/calendar">Go to Calendar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Successfully accepted
  if (accepted) {
    return (
      <div className="w-full max-w-md">
        <Card className="border-4 border-border shadow-[8px_8px_0px_0px_var(--shadow-color)]">
          <CardHeader className="border-b-4 border-border bg-green-500/20">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="size-6 text-green-600" />
              Welcome to {invitation.familyName}!
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-muted-foreground">
              You have successfully joined the family. Redirecting you to the calendar...
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not logged in - show sign up / sign in options
  if (!clerkUser) {
    return (
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground">FamLoop</h1>
        </div>

        <Card className="border-4 border-border shadow-[8px_8px_0px_0px_var(--shadow-color)]">
          <CardHeader className="border-b-4 border-border bg-primary/20">
            <CardTitle className="flex items-center gap-2">
              <Users className="size-6" />
              Family Invitation
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">
                You&apos;ve been invited to join
              </p>
              <p className="text-2xl font-black text-primary">
                {invitation.familyName}
              </p>
              <p className="text-sm text-muted-foreground">
                Invited by {invitation.inviterName}
              </p>
            </div>

            <div className="border-t border-border pt-6 space-y-3">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Sign in or create an account to join this family
              </p>

              <Button asChild className="w-full h-12 text-lg font-bold">
                <Link href={`/auth/signup?redirect_url=${encodeURIComponent(redirectUrl)}`}>
                  <UserPlus className="mr-2 size-5" />
                  Create Account
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full h-12 text-lg font-bold">
                <Link href={`/auth/login?redirect_url=${encodeURIComponent(redirectUrl)}`}>
                  <LogIn className="mr-2 size-5" />
                  Sign In
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Logged in - show join button (with potential family warning)
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground">FamLoop</h1>
      </div>

      <Card className="border-4 border-border shadow-[8px_8px_0px_0px_var(--shadow-color)]">
        <CardHeader className="border-b-4 border-border bg-primary/20">
          <CardTitle className="flex items-center gap-2">
            <Users className="size-6" />
            Family Invitation
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold">
              You&apos;ve been invited to join
            </p>
            <p className="text-2xl font-black text-primary">
              {invitation.familyName}
            </p>
            <p className="text-sm text-muted-foreground">
              Invited by {invitation.inviterName}
            </p>
          </div>

          {showFamilyWarning && (
            <div className="p-4 rounded-md bg-amber-500/10 border-2 border-amber-500/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-semibold text-amber-800 dark:text-amber-200">
                    You&apos;re already in a family
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Joining this family will remove you from your current family. Are you sure you want to continue?
                  </p>
                </div>
              </div>
            </div>
          )}

          {acceptError && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {acceptError}
            </div>
          )}

          <div className="border-t border-border pt-6 space-y-3">
            <Button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full h-12 text-lg font-bold"
            >
              {accepting ? (
                "Joining..."
              ) : showFamilyWarning ? (
                "Yes, Switch Family"
              ) : (
                <>
                  <CheckCircle className="mr-2 size-5" />
                  Join {invitation.familyName}
                </>
              )}
            </Button>

            {showFamilyWarning && (
              <Button
                variant="outline"
                onClick={() => setShowFamilyWarning(false)}
                className="w-full"
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function InvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Suspense
        fallback={
          <div className="w-full max-w-md">
            <Card className="border-4 border-border shadow-[8px_8px_0px_0px_var(--shadow-color)]">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        }
      >
        <InvitePageContent />
      </Suspense>
    </div>
  );
}
