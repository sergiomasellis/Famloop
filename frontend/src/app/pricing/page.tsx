"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PlanPublic, createCheckoutSession, fetchPlans } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type PlanFeature = {
  key: string;
  label: string;
  plans: Array<PlanPublic["name"]>;
};

const FEATURE_MATRIX: PlanFeature[] = [
  { key: "kids", label: "Kids per household", plans: ["free", "family_plus", "family_pro"] },
  { key: "recurring", label: "Recurring chores", plans: ["family_plus", "family_pro"] },
  { key: "rewards", label: "Rewards & points", plans: ["family_plus", "family_pro"] },
  { key: "calendar", label: "Calendar sharing/export", plans: ["family_plus", "family_pro"] },
  { key: "integrations", label: "Integrations (Google/ICS)", plans: ["family_pro"] },
  { key: "support", label: "Priority support", plans: ["family_pro"] },
];

function formatPrice(cents: number | null | undefined) {
  if (cents == null) return "N/A";
  return `$${(cents / 100).toFixed(0)}/mo`;
}

export default function PricingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [plans, setPlans] = useState<PlanPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchPlans();
        setPlans(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const paidPlans = useMemo(
    () => plans.filter((p) => p.name !== "free").filter((p) => p.price_monthly_id),
    [plans]
  );

  const handleSelect = async (plan: PlanPublic) => {
    if (plan.name === "free") {
      router.push(isAuthenticated ? "/dashboard" : "/auth/signup");
      return;
    }

    if (!plan.price_monthly_id) {
      setError("Billing is not ready yet. Please try again later.");
      return;
    }

    try {
      setCheckingOut(plan.name);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const successUrl = `${origin}/dashboard/billing`;
      const cancelUrl = `${origin}/pricing`;
      const session = await createCheckoutSession(plan.price_monthly_id, successUrl, cancelUrl);
      if (typeof window !== "undefined") {
        window.location.href = session.url;
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCheckingOut(null);
    }
  };

  if (loading) {
    return <div className="p-8">Loading plans…</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Simple plans for families</h1>
        <p className="text-muted-foreground">
          Start free, upgrade when you need more members, recurring chores, or integrations.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} className={plan.name !== "free" ? "border-primary/30" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{plan.label}</span>
                {plan.name === "family_pro" && <Badge>Best value</Badge>}
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold mb-2">
                {plan.monthly_price_cents === 0 ? "Free" : formatPrice(plan.monthly_price_cents)}
              </div>
              {plan.annual_price_cents ? (
                <p className="text-sm text-muted-foreground">
                  Save with annual: ${(plan.annual_price_cents / 100).toFixed(0)}/yr
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">&nbsp;</p>
              )}

              <ul className="mt-4 space-y-2 text-sm">
                {FEATURE_MATRIX.map((feature) => (
                  <li key={feature.key} className="flex items-center gap-2">
                    <span>{feature.label}</span>
                    {feature.key === "kids" && (
                      <Badge variant="outline">
                        {plan.max_children ? `${plan.max_children} kids` : "Unlimited kids"}
                      </Badge>
                    )}
                    {feature.plans.includes(plan.name) ? (
                      <Badge variant="secondary">Included</Badge>
                    ) : (
                      <Badge variant="outline">Not included</Badge>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handleSelect(plan)}
                variant={plan.name === "free" ? "outline" : "default"}
                disabled={checkingOut === plan.name}
              >
                {plan.name === "free" ? "Get started free" : checkingOut === plan.name ? "Redirecting…" : "Upgrade"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {paidPlans.length === 0 && (
        <div className="mt-4 text-sm text-muted-foreground">
          Stripe prices are not configured yet. Add price IDs to enable checkout.
        </div>
      )}
    </div>
  );
}

