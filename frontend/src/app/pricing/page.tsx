"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PlanPublic, createCheckoutSession, fetchPlans } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Sparkles, TrendingUp, Crown, Zap, ArrowRight, Star } from "lucide-react";

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
  return `$${(cents / 100).toFixed(0)}`;
}

// Plan color mapping
const PLAN_COLORS: Record<string, { bg: string; icon: React.ReactNode }> = {
  free: { bg: "bg-muted", icon: <Star className="size-6" /> },
  family_plus: { bg: "bg-primary", icon: <Zap className="size-6" /> },
  family_pro: { bg: "bg-secondary", icon: <Crown className="size-6" /> },
};

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
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="text-center py-20">
          <div className="text-6xl animate-bounce mb-4">💰</div>
          <p className="text-xl font-black uppercase">Loading plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Card className="max-w-md mx-auto border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow-color)] bg-destructive/10">
          <CardContent className="py-12 text-center">
            <div className="text-5xl mb-4">😢</div>
            <p className="text-xl font-black uppercase text-destructive mb-2">Something went wrong</p>
            <p className="text-sm font-bold text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <Badge className="px-4 py-2 text-sm font-black uppercase border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] bg-secondary text-secondary-foreground">
          <TrendingUp className="size-4 mr-2" />
          Simple Pricing
        </Badge>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
          Plans for Every Family
        </h1>
        <p className="text-lg text-muted-foreground font-bold">
          Start free, upgrade when you need more. No hidden fees, cancel anytime.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
        {plans.map((plan) => {
          const isFeatured = plan.name === "family_plus";
          const planColor = PLAN_COLORS[plan.name] || PLAN_COLORS.free;

          return (
            <Card
              key={plan.name}
              className={`relative overflow-hidden border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] transition-all ${isFeatured ? 'ring-4 ring-primary' : ''}`}
            >
              {/* Featured badge */}
              {isFeatured && (
                <div className="absolute -top-1 -right-1 z-10">
                  <div className="bg-primary text-primary-foreground px-4 py-1 text-xs font-black uppercase border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] rotate-3">
                    Most Popular
                  </div>
                </div>
              )}

              {plan.name === "family_pro" && (
                <div className="absolute -top-1 -right-1 z-10">
                  <div className="bg-secondary text-secondary-foreground px-4 py-1 text-xs font-black uppercase border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] rotate-3">
                    Best Value
                  </div>
                </div>
              )}

              {/* Header with color accent */}
              <CardHeader className={`${planColor.bg} ${plan.name !== 'free' ? 'text-primary-foreground' : ''} border-b-2 border-border`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-background/20 rounded-lg border-2 border-border">
                    {planColor.icon}
                  </div>
                  <CardTitle className="text-2xl font-black uppercase">{plan.label}</CardTitle>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black">
                    {plan.monthly_price_cents === 0 ? "Free" : formatPrice(plan.monthly_price_cents)}
                  </span>
                  {plan.monthly_price_cents !== 0 && (
                    <span className="font-bold opacity-80">/month</span>
                  )}
                </div>
                <CardDescription className={`font-bold mt-2 ${plan.name !== 'free' ? 'text-primary-foreground/80' : ''}`}>
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-6 space-y-4">
                {/* Kids limit */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border-2 border-border">
                  <span className="font-bold">Kids limit</span>
                  <Badge className="border-2 border-border shadow-[1px_1px_0px_0px_var(--shadow-color)] font-black">
                    {plan.max_children ? `${plan.max_children} kids` : "Unlimited"}
                  </Badge>
                </div>

                {/* Feature list */}
                <ul className="space-y-3">
                  {FEATURE_MATRIX.filter(f => f.key !== 'kids').map((feature) => {
                    const included = feature.plans.includes(plan.name);
                    return (
                      <li key={feature.key} className={`flex items-center gap-3 text-sm font-bold ${!included ? 'opacity-40' : ''}`}>
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${included ? 'bg-accent text-accent-foreground' : 'bg-muted'} border border-border`}>
                          {included ? <CheckCircle className="size-4" /> : <span className="text-xs">—</span>}
                        </div>
                        {feature.label}
                      </li>
                    );
                  })}
                </ul>

                {/* Annual savings */}
                {plan.annual_price_cents ? (
                  <div className="p-3 bg-accent/20 rounded-lg border-2 border-border text-center">
                    <p className="text-sm font-black uppercase">
                      💰 Save with annual: ${(plan.annual_price_cents / 100).toFixed(0)}/yr
                    </p>
                  </div>
                ) : null}
              </CardContent>

              <CardFooter className="border-t-2 border-border pt-4">
                <Button
                  className={`w-full font-black uppercase border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all group ${isFeatured ? '' : ''}`}
                  onClick={() => handleSelect(plan)}
                  variant={plan.name === "free" ? "outline" : "default"}
                  disabled={checkingOut === plan.name}
                >
                  {plan.name === "free" ? (
                    "Get Started Free"
                  ) : checkingOut === plan.name ? (
                    "Redirecting..."
                  ) : (
                    <>
                      Upgrade Now
                      <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {paidPlans.length === 0 && (
        <div className="text-center">
          <div className="inline-block px-4 py-2 bg-muted rounded-lg border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)]">
            <p className="text-sm font-bold text-muted-foreground">
              Stripe prices are not configured yet. Add price IDs to enable checkout.
            </p>
          </div>
        </div>
      )}

      {/* Trust badges */}
      <div className="text-center py-8 space-y-4">
        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)]">
            <span className="text-xl">🔒</span>
            <span className="font-bold text-sm">Secure Payments</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)]">
            <span className="text-xl">💳</span>
            <span className="font-bold text-sm">Cancel Anytime</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)]">
            <span className="text-xl">✨</span>
            <span className="font-bold text-sm">Free Forever Plan</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground font-bold">
          Powered by Stripe. Your payment information is never stored on our servers.
        </p>
      </div>
    </div>
  );
}
