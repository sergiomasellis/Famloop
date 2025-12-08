"use client";

import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  PlanPublic,
  SubscriptionStatus,
  Invoice,
  cancelSubscription,
  createBillingPortalSession,
  createCheckoutSession,
  fetchPlans,
  fetchSubscription,
  fetchInvoices,
  resumeSubscription,
} from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

function formatDate(dateString?: string | null) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

function BillingContent() {
  const { isAuthenticated } = useAuth();
  const [plans, setPlans] = useState<PlanPublic[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      try {
        const [planData, subData, invoiceData] = await Promise.all([
          fetchPlans(),
          fetchSubscription(),
          fetchInvoices().catch(() => []),
        ]);
        setPlans(planData);
        setSubscription(subData);
        setInvoices(invoiceData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated]);

  const currentPlan = useMemo(() => {
    if (!subscription) return null;
    return plans.find((p) => p.name === subscription.plan) ?? null;
  }, [plans, subscription]);

  const handlePortal = async () => {
    try {
      setError(null);
      setActionMessage(null);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const session = await createBillingPortalSession(`${origin}/dashboard/billing`);
      if (typeof window !== "undefined") {
        window.location.href = session.url;
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleUpgrade = async (plan: PlanPublic) => {
    if (!plan.price_monthly_id) {
      setError("Billing is not ready for this plan.");
      return;
    }

    try {
      setBusyPlan(plan.name);
      setError(null);
      setActionMessage(null);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const session = await createCheckoutSession(
        plan.price_monthly_id,
        `${origin}/dashboard/billing`,
        `${origin}/dashboard/billing`
      );
      if (typeof window !== "undefined") {
        window.location.href = session.url;
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyPlan(null);
    }
  };

  const handleCancel = async () => {
    try {
      const updated = await cancelSubscription();
      setSubscription(updated);
      setActionMessage("Subscription will cancel at period end.");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleResume = async () => {
    try {
      const updated = await resumeSubscription();
      setSubscription(updated);
      setActionMessage("Cancellation removed. Subscription will renew.");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return <div className="p-6">Loading billing...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Billing</h1>
          <p className="text-muted-foreground">
            Manage your Famloop subscription, upgrade, or open the Stripe portal.
          </p>
        </div>
        <Button variant="outline" onClick={handlePortal} disabled={!subscription?.is_active}>
          Manage in Stripe
        </Button>
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}
      {actionMessage && <div className="text-green-600 text-sm">{actionMessage}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
          <CardDescription>
            {currentPlan ? currentPlan.label : subscription?.plan ?? "Unknown"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{subscription?.status ?? "inactive"}</Badge>
            {subscription?.cancel_at_period_end && (
              <Badge variant="outline">Cancels at period end</Badge>
            )}
          </div>
          <div>Renews: {formatDate(subscription?.current_period_end)}</div>

          <div className="flex gap-3">
            {subscription?.cancel_at_period_end ? (
              <Button variant="secondary" onClick={handleResume}>
                Resume
              </Button>
            ) : subscription?.is_active ? (
              <Button variant="outline" onClick={handleCancel}>
                Cancel at period end
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {plans
          .filter((p) => p.name !== subscription?.plan)
          .filter((p) => p.price_monthly_id)
          .map((plan) => (
            <Card key={plan.name}>
              <CardHeader>
                <CardTitle>{plan.label}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-semibold">
                  {plan.monthly_price_cents ? `$${(plan.monthly_price_cents / 100).toFixed(0)}/mo` : "N/A"}
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>Kids: {plan.max_children ? `${plan.max_children} included` : "Unlimited"}</div>
                  <div>Families: {plan.max_families ?? 1}</div>
                </div>
                <Button className="w-full" onClick={() => handleUpgrade(plan)} disabled={busyPlan === plan.name}>
                  {busyPlan === plan.name ? "Redirecting…" : "Switch to this plan"}
                </Button>
              </CardContent>
            </Card>
          ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Billing history</CardTitle>
          <CardDescription>Your recent invoices and receipts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices available yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-t">
                      <td className="py-2">{formatDate(inv.created)}</td>
                      <td className="py-2">
                        ${(inv.amount_paid || inv.amount_due) / 100} {inv.currency.toUpperCase()}
                      </td>
                      <td className="py-2 capitalize">{inv.status}</td>
                      <td className="py-2">
                        {inv.hosted_invoice_url ? (
                          <a
                            href={inv.hosted_invoice_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            View
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingPage() {
  return (
    <ProtectedRoute>
      <BillingContent />
    </ProtectedRoute>
  );
}

