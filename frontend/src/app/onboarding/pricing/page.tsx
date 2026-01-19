"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useFamily } from "@/hooks/useFamily";
import { Sparkles, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

type Plan = {
  id: string;
  name: string;
  price: number;
  interval: string;
  priceId?: string;
  features: string[];
};

type PlanFeature = {
  key: string;
  label: string;
  plans: string[];
};

const FEATURE_MATRIX: PlanFeature[] = [
  { key: "kids", label: "Kids per household", plans: ["Free", "Family+", "Family Pro"] },
  { key: "recurring", label: "Recurring chores", plans: ["Family+", "Family Pro"] },
  { key: "rewards", label: "Rewards & points", plans: ["Family+", "Family Pro"] },
  { key: "calendar", label: "Calendar sharing/export", plans: ["Family+", "Family Pro"] },
  { key: "integrations", label: "Integrations (Google/ICS)", plans: ["Family Pro"] },
  { key: "support", label: "Priority support", plans: ["Family Pro"] },
];

function formatPrice(price: number) {
  if (price === 0) return "Free";
  return `$${price.toFixed(2)}/mo`;
}

function OnboardingPricingContent() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { family, loading: familyLoading } = useFamily();

  // Fetch plans from Convex
  const plansData = useQuery(api.billing.getPricingPlans);
  const createCheckout = useAction(api.billing.createCheckoutSession);

  const plans = (plansData || []) as Plan[];
  const loading = plansData === undefined;
  const [error, setError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  // Ensure the user completes step 1 first
  useEffect(() => {
    if (!familyLoading && !family) {
      router.replace("/onboarding/family");
    }
  }, [family, familyLoading, router]);

  const paidPlans = useMemo(
    () => plans.filter((p) => p.id !== "free").filter((p) => p.priceId),
    [plans]
  );

  const planGridCols = useMemo(
    () => (plans.length > 1 ? "md:grid-cols-2" : "md:grid-cols-1"),
    [plans.length]
  );

  const handleSelect = async (plan: Plan) => {
    if (plan.id === "free") {
      router.push("/onboarding/members");
      return;
    }

    if (!plan.priceId) {
      setError("Billing is not ready yet. Please try again later.");
      return;
    }

    try {
      setCheckingOut(plan.id);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const successUrl = `${origin}/onboarding/members`;
      const cancelUrl = `${origin}/onboarding/pricing`;
      const session = await createCheckout({
        priceId: plan.priceId,
        successUrl,
        cancelUrl,
      });
      if (typeof window !== "undefined" && session.url) {
        window.location.href = session.url;
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCheckingOut(null);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            Onboarding · Step 2 of 2
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Choose your plan</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Activate your FamLoop workspace. Start free or upgrade to unlock recurring chores, exports, and more.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <Card className="border-4 border-border shadow-[8px_8px_0px_0px_var(--shadow-color)]">
            <CardHeader>
              <CardTitle>Plans built for families</CardTitle>
              <CardDescription>Pick what fits now — you can change or cancel anytime.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="text-4xl animate-bounce mb-2">💰</div>
                  <p className="font-bold text-muted-foreground">Loading plans...</p>
                </div>
              ) : error ? (
                <div className="p-4 rounded-md border-2 border-destructive bg-destructive/10 text-destructive text-sm font-semibold">
                  {error}
                </div>
              ) : (
                <div className={`grid gap-4 ${planGridCols}`}>
                  {plans.map((plan) => (
                    <Card key={plan.id} className={plan.id !== "free" ? "border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow-color)]" : "border-2 border-border"}>
                      <CardHeader className="space-y-1">
                        <CardTitle className="flex items-center justify-between">
                          <span>{plan.name}</span>
                          {plan.id === "family_pro" && <Badge>Best value</Badge>}
                        </CardTitle>
                        <CardDescription>
                          {plan.features.length > 0 ? plan.features[0] : "Basic features"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-3xl font-semibold">
                          {formatPrice(plan.price)}
                        </div>
                        <p className="text-sm text-muted-foreground">&nbsp;</p>
                        <div className="space-y-2 text-sm">
                          {plan.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          className="w-full font-bold uppercase border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                          onClick={() => handleSelect(plan)}
                          variant={plan.id === "free" ? "outline" : "default"}
                          disabled={checkingOut === plan.id}
                        >
                          {plan.id === "free"
                            ? "Start Free"
                            : checkingOut === plan.id
                            ? "Redirecting..."
                            : "Upgrade Now"}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}

              {paidPlans.length === 0 && !loading && !error && (
                <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                  Stripe prices are not configured yet. Add price IDs to enable checkout.
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t-2 border-border bg-muted/40 mt-2 pt-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary">Tip</Badge>
                You can switch or cancel anytime from Billing.
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto font-bold uppercase border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_var(--shadow-color)] transition-all"
                  onClick={() => router.push("/onboarding/family")}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button
                  type="button"
                  className="w-full sm:w-auto font-bold uppercase border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_var(--shadow-color)] transition-all"
                  variant="secondary"
                  onClick={() => router.push("/dashboard")}
                >
                  Skip for now
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardFooter>
          </Card>

          <Card className="border-2 border-dashed">
            <CardHeader>
              <CardTitle>Need help deciding?</CardTitle>
              <CardDescription>Quick guidance before you checkout.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="font-semibold">Family Plus</p>
                <p className="text-muted-foreground">
                  Best for small families wanting recurring chores, rewards, and exports.
                </p>
              </div>
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="font-semibold">Family Pro</p>
                <p className="text-muted-foreground">
                  For busy households: integrations, priority support, and larger limits.
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="font-semibold">Already subscribed?</p>
                <p className="text-muted-foreground">
                  You can manage or change plans anytime from Billing in your dashboard.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPricingPage() {
  return (
    <ProtectedRoute>
      <OnboardingPricingContent />
    </ProtectedRoute>
  );
}


