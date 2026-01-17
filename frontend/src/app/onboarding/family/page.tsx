"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFamily } from "@/hooks/useFamily";
import { useFamilies } from "@/hooks/useFamilies";
import { Users, KeyRound, ArrowRight, Sparkles } from "lucide-react";

function CreateFamilyContent() {
  const router = useRouter();
  const { family, loading: familyLoading, error: familyError } = useFamily();
  const { createFamily, loading: creatingFamily, error: createFamilyError } = useFamilies();

  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);
  const confirmPinInputRef = useRef<HTMLInputElement>(null);

  // If a family already exists, move the user to the pricing/subscription step
  useEffect(() => {
    if (!familyLoading && family) {
      router.replace("/onboarding/pricing");
    }
  }, [family, familyLoading, router]);

  const errorMessage = useMemo(
    () => formError || createFamilyError || familyError,
    [formError, createFamilyError, familyError]
  );

  // Handle PIN input - only allow digits and limit to 6
  const handlePinChange = (value: string, setter: (v: string) => void) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 6);
    setter(digitsOnly);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Family name is required");
      return;
    }

    if (!pin || pin.length < 4) {
      setFormError("PIN must be at least 4 digits");
      return;
    }

    if (pin !== confirmPin) {
      setFormError("PINs do not match");
      return;
    }

    const created = await createFamily({
      name: name.trim(),
      adminPin: pin,
    });

    if (created) {
      router.push("/onboarding/pricing");
    }
  };

  if (familyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Preparing your workspace…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            Onboarding · Step 1 of 2
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Create your family</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Name your household and create a parent PIN. You&apos;ll add members next and then pick the plan that fits.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <Card className="border-4 border-border shadow-[8px_8px_0px_0px_var(--shadow-color)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Family details
              </CardTitle>
              <CardDescription>We use this to organize chores, events, and permissions.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-5 pb-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold" htmlFor="family-name">
                    Family name
                  </label>
                  <Input
                    id="family-name"
                    placeholder="The Smith Family"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={creatingFamily}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2" htmlFor="admin-pin">
                    <KeyRound className="h-4 w-4" />
                    Parent PIN
                  </label>
                  <Input
                    ref={pinInputRef}
                    id="admin-pin"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="4-6 digit PIN"
                    value={pin}
                    onChange={(e) => handlePinChange(e.target.value, setPin)}
                    required
                    maxLength={6}
                    disabled={creatingFamily}
                    className="font-mono text-lg tracking-[0.5em] text-center"
                  />
                  <p className="text-xs text-muted-foreground">
                    This PIN protects parent-only features like settings and approvals.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold" htmlFor="confirm-pin">
                    Confirm PIN
                  </label>
                  <Input
                    ref={confirmPinInputRef}
                    id="confirm-pin"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Re-enter PIN"
                    value={confirmPin}
                    onChange={(e) => handlePinChange(e.target.value, setConfirmPin)}
                    required
                    maxLength={6}
                    disabled={creatingFamily}
                    className="font-mono text-lg tracking-[0.5em] text-center"
                  />
                </div>

                {errorMessage && (
                  <div className="text-sm font-semibold text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                    {errorMessage}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t-2 border-border bg-muted/40 mt-2 pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">Required</Badge>
                  You can add kids or co-parents after this step.
                </div>
                <Button type="submit" disabled={creatingFamily}>
                  {creatingFamily ? "Creating family..." : "Save and continue"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="border-2 border-dashed">
            <CardHeader>
              <CardTitle>What happens next?</CardTitle>
              <CardDescription>A quick preview of the remaining steps.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                    1
                  </span>
                  Create family (current step)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Set your household name and create a parent PIN to secure settings.
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-foreground font-bold">
                    2
                  </span>
                  Pick a plan
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You&apos;ll see pricing options to activate your subscription.
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-foreground font-bold">
                    3
                  </span>
                  Add family members
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Invite kids and co-parents, set roles, and start assigning chores.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CreateFamilyPage() {
  return (
    <ProtectedRoute>
      <CreateFamilyContent />
    </ProtectedRoute>
  );
}
