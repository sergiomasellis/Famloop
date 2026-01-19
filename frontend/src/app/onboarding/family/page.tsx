"use client";

import { useEffect, useMemo, useState, useRef, KeyboardEvent, ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFamily } from "@/hooks/useFamily";
import { useFamilies } from "@/hooks/useFamilies";
import { Users, KeyRound, ArrowRight, Sparkles } from "lucide-react";

// PIN Input Component - 4 individual digit boxes
function PinInput({
  value,
  onChange,
  disabled,
  label,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label: string;
  id: string;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(4, "").slice(0, 4).split("");

  const focusInput = (index: number) => {
    if (index >= 0 && index < 4) {
      inputRefs.current[index]?.focus();
    }
  };

  const handleChange = (index: number, digit: string) => {
    // Only allow single digit
    const cleanDigit = digit.replace(/\D/g, "").slice(-1);

    const newDigits = [...digits];
    newDigits[index] = cleanDigit;
    const newValue = newDigits.join("").replace(/\s/g, "");
    onChange(newValue);

    // Auto-focus next input if digit entered
    if (cleanDigit && index < 3) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // If current is empty, move to previous and clear it
        focusInput(index - 1);
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        onChange(newDigits.join("").replace(/\s/g, ""));
        e.preventDefault();
      } else {
        // Clear current
        const newDigits = [...digits];
        newDigits[index] = "";
        onChange(newDigits.join("").replace(/\s/g, ""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      focusInput(index - 1);
      e.preventDefault();
    } else if (e.key === "ArrowRight" && index < 3) {
      focusInput(index + 1);
      e.preventDefault();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    onChange(pastedData);
    // Focus the last filled input or the next empty one
    focusInput(Math.min(pastedData.length, 3));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-bold flex items-center gap-2" htmlFor={`${id}-0`}>
        <KeyRound className="h-4 w-4" />
        {label}
      </label>
      <div className="flex gap-3 justify-center">
        {[0, 1, 2, 3].map((index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            id={index === 0 ? `${id}-0` : undefined}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[index] || ""}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            disabled={disabled}
            className="w-14 h-16 text-center text-2xl font-black border-2 border-border rounded-xl bg-input shadow-[3px_3px_0px_0px_var(--shadow-color)] focus:outline-none focus:ring-2 focus:ring-primary focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0px_0px_var(--shadow-color)] transition-all disabled:opacity-50"
            autoComplete="off"
          />
        ))}
      </div>
    </div>
  );
}

function CreateFamilyContent() {
  const router = useRouter();
  const { family, loading: familyLoading, error: familyError } = useFamily();
  const { createFamily, loading: creatingFamily, error: createFamilyError } = useFamilies();

  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Family name is required");
      return;
    }

    if (!pin || pin.length < 4) {
      setFormError("Please enter all 4 digits of your PIN");
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
        <div className="text-center">
          <div className="text-5xl animate-bounce mb-3">🏠</div>
          <p className="font-bold text-muted-foreground">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-border px-4 py-1.5 text-xs font-bold uppercase text-muted-foreground shadow-[2px_2px_0px_0px_var(--shadow-color)]">
            <Sparkles className="h-4 w-4" />
            Onboarding · Step 1 of 3
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight">Create Your Family</h1>
          <p className="text-muted-foreground font-bold max-w-2xl mx-auto">
            Name your household and create a 4-digit parent PIN. You&apos;ll add members next!
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <Card className="border-4 border-border shadow-[8px_8px_0px_0px_var(--shadow-color)]">
            <CardHeader className="bg-primary text-primary-foreground border-b-2 border-border">
              <CardTitle className="flex items-center gap-2 font-black uppercase">
                <Users className="h-5 w-5" />
                Family Details
              </CardTitle>
              <CardDescription className="text-primary-foreground/80 font-medium">
                We use this to organize chores, events, and permissions.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6 pt-6 pb-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase" htmlFor="family-name">
                    Family Name
                  </label>
                  <Input
                    id="family-name"
                    placeholder="The Smith Family"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={creatingFamily}
                    className="h-12 text-lg font-bold border-2 border-border shadow-[3px_3px_0px_0px_var(--shadow-color)] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0px_0px_var(--shadow-color)] transition-all"
                  />
                </div>

                <div className="p-4 bg-muted/50 rounded-xl border-2 border-border space-y-4">
                  <PinInput
                    id="admin-pin"
                    label="Create PIN"
                    value={pin}
                    onChange={setPin}
                    disabled={creatingFamily}
                  />
                  <p className="text-xs text-muted-foreground text-center font-medium">
                    This PIN protects parent-only features like settings and approvals.
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-xl border-2 border-border">
                  <PinInput
                    id="confirm-pin"
                    label="Confirm PIN"
                    value={confirmPin}
                    onChange={setConfirmPin}
                    disabled={creatingFamily}
                  />
                </div>

                {/* PIN match indicator */}
                {pin.length === 4 && confirmPin.length === 4 && (
                  <div className={`text-center text-sm font-bold ${pin === confirmPin ? 'text-accent' : 'text-destructive'}`}>
                    {pin === confirmPin ? '✓ PINs match!' : '✗ PINs do not match'}
                  </div>
                )}

                {errorMessage && (
                  <div className="text-sm font-bold text-destructive bg-destructive/10 border-2 border-destructive/30 rounded-xl px-4 py-3 text-center">
                    {errorMessage}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t-2 border-border bg-muted/40 mt-2 pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <Badge variant="secondary" className="font-bold uppercase">Required</Badge>
                  You can add kids or co-parents after this step.
                </div>
                <Button
                  type="submit"
                  disabled={creatingFamily || pin.length < 4 || confirmPin.length < 4}
                  className="font-bold uppercase border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                >
                  {creatingFamily ? "Creating..." : "Save & Continue"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="border-2 border-dashed border-border">
            <CardHeader>
              <CardTitle className="font-black uppercase">What happens next?</CardTitle>
              <CardDescription className="font-medium">A quick preview of the remaining steps.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border-2 border-border bg-primary/10 p-4 shadow-[2px_2px_0px_0px_var(--shadow-color)]">
                <p className="text-sm font-bold flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)]">
                    1
                  </span>
                  Create family (current step)
                </p>
                <p className="text-xs text-muted-foreground mt-2 ml-11 font-medium">
                  Set your household name and create a parent PIN to secure settings.
                </p>
              </div>
              <div className="rounded-xl border-2 border-border p-4">
                <p className="text-sm font-bold flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground font-black border-2 border-border">
                    2
                  </span>
                  Pick a plan
                </p>
                <p className="text-xs text-muted-foreground mt-2 ml-11 font-medium">
                  You&apos;ll see pricing options to activate your subscription.
                </p>
              </div>
              <div className="rounded-xl border-2 border-border p-4">
                <p className="text-sm font-bold flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground font-black border-2 border-border">
                    3
                  </span>
                  Add family members
                </p>
                <p className="text-xs text-muted-foreground mt-2 ml-11 font-medium">
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
