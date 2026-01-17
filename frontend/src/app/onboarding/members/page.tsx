"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFamily } from "@/hooks/useFamily";
import { useFamilyMembers, useCreateFamilyMember, FamilyMember } from "@/hooks/useFamilyMembers";
import { Sparkles, ArrowLeft, ArrowRight, Users, UserPlus } from "lucide-react";

function MemberList({ members }: { members: FamilyMember[] }) {
  if (members.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        No members yet. Add a parent or kid to get started.
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {members.map((m) => (
        <div
          key={m._id}
          className="flex items-center justify-between rounded-lg border-2 border-border bg-card px-3 py-2 shadow-[2px_2px_0px_0px_var(--shadow-color)]"
        >
          <div className="flex items-center gap-3">
            {m.iconEmoji ? (
              <span className="text-xl">{m.iconEmoji}</span>
            ) : (
              <Users className="h-4 w-4" />
            )}
            <div className="flex flex-col">
              <span className="font-semibold">{m.name}</span>
              <span className="text-xs text-muted-foreground">{m.role === "parent" ? "Parent" : "Child"}</span>
            </div>
          </div>
          <Badge variant="outline">{m.email ?? "No email"}</Badge>
        </div>
      ))}
    </div>
  );
}

function OnboardingMembersContent() {
  const router = useRouter();
  const { family, loading: familyLoading } = useFamily();
  const { members, loading: membersLoading, refetch: refetchMembers } = useFamilyMembers(family?._id);
  const { createMember, loading: creatingMember } = useCreateFamilyMember();

  const [name, setName] = useState("");
  const [role, setRole] = useState<"parent" | "child">("child");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!familyLoading && !family) {
      router.replace("/onboarding/family");
    }
  }, [family, familyLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family?._id) return;

    setError(null);

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    try {
      await createMember({
        name: name.trim(),
        role,
      });
      setName("");
      setRole("child");
      // Data updates automatically via Convex reactive queries
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    }
  };

  const isLoading = familyLoading || membersLoading;

  const memberCount = useMemo(() => members.length, [members.length]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            Onboarding · Step 3 of 3
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Add your family members</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Invite kids and co-parents now or add more later from Settings.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-[1.2fr_1fr]">
          <Card className="border-4 border-border shadow-[8px_8px_0px_0px_var(--shadow-color)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Add a member
              </CardTitle>
              <CardDescription>Add family members. Kids don&apos;t need email accounts.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold" htmlFor="member-name">
                    Full name
                  </label>
                  <Input
                    id="member-name"
                    placeholder="Jane Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={creatingMember || isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold" htmlFor="member-role">
                    Role
                  </label>
                  <Select value={role} onValueChange={(v) => setRole(v as "parent" | "child")} disabled={creatingMember || isLoading}>
                    <SelectTrigger id="member-role" className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="child">Child</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {error && (
                  <div className="text-sm font-semibold text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                    {error}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 flex-wrap border-t-2 border-border bg-muted/40 mt-2 pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-1 min-w-0">
                  <Badge variant="secondary">Optional</Badge>
                  You can add more later in Settings.
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button type="submit" className="w-full sm:w-auto" disabled={creatingMember || isLoading}>
                    {creatingMember ? "Adding..." : "Add member"}
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Card>

          <Card className="border-2 border-dashed">
            <CardHeader>
              <CardTitle>Current family</CardTitle>
              <CardDescription>
                {isLoading ? "Loading members..." : `${memberCount} member${memberCount === 1 ? "" : "s"}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {isLoading ? (
                <div className="p-3 text-muted-foreground">Loading members…</div>
              ) : (
                <MemberList members={members} />
              )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 flex-wrap border-t-2 border-border bg-muted/40 mt-2 pt-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-1 min-w-[260px] whitespace-normal leading-snug">
                <Badge variant="secondary">Next</Badge>
                Head to your dashboard once you're ready.
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto h-12 text-base font-semibold"
                  onClick={() => router.push("/onboarding/pricing")}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button
                  type="button"
                  className="w-full sm:w-auto h-12 text-base font-bold"
                  variant="secondary"
                  onClick={() => router.push("/calendar")}
                >
                  Go to dashboard
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingMembersPage() {
  return (
    <ProtectedRoute>
      <OnboardingMembersContent />
    </ProtectedRoute>
  );
}
