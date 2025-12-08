// Get API base URL - called at runtime to use correct hostname
function getApiBase(): string {
  // If explicitly set, use the env variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // On the client, use the same hostname as the current page but on port 8000
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:8000/api`;
  }
  
  // Server-side fallback
  return "http://localhost:8000/api";
}

export function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
}

export async function apiFetch(url: string, options: RequestInit = {}) {
  const apiBase = getApiBase(); // Evaluate at runtime, not module load
  const headers = getAuthHeaders();
  
  const response = await fetch(`${apiBase}${url}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  // If unauthorized, clear token and redirect to login
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      window.location.href = "/auth/login";
    }
    throw new Error("Unauthorized");
  }

  return response;
}

// Password reset functions
export async function forgotPassword(email: string): Promise<{ message: string }> {
  const response = await apiFetch("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to request password reset" }));
    throw new Error(error.detail || "Failed to request password reset");
  }
  
  return response.json();
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  const response = await apiFetch("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, new_password: newPassword }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to reset password" }));
    throw new Error(error.detail || "Failed to reset password");
  }
  
  return response.json();
}

// QR Code login functions
export async function generateQRCodeSession(): Promise<{ session_token: string; expires_at: string; qr_code_url: string }> {
  const response = await apiFetch("/auth/qr-code/generate", {
    method: "POST",
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to generate QR code session" }));
    throw new Error(error.detail || "Failed to generate QR code session");
  }
  
  return response.json();
}

export async function checkQRCodeStatus(sessionToken: string): Promise<{ status: "pending" | "scanned" | "expired"; access_token?: string }> {
  const response = await apiFetch(`/auth/qr-code/status/${sessionToken}`, {
    method: "GET",
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to check QR code status" }));
    throw new Error(error.detail || "Failed to check QR code status");
  }
  
  return response.json();
}


// Billing types
export type PlanPublic = {
  name: "free" | "family_plus" | "family_pro";
  label: string;
  description: string;
  currency: string;
  monthly_price_cents: number | null;
  annual_price_cents: number | null;
  price_monthly_id?: string | null;
  price_annual_id?: string | null;
  max_children?: number | null;
  max_families?: number | null;
};

export type SubscriptionStatus = {
  plan: PlanPublic["name"];
  status: string;
  price_id?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end: boolean;
  is_active: boolean;
};

export async function fetchPlans(): Promise<PlanPublic[]> {
  const response = await apiFetch("/billing/plans", { method: "GET" });
  if (!response.ok) {
    throw new Error("Unable to load plans");
  }
  return response.json();
}

export async function fetchSubscription(): Promise<SubscriptionStatus> {
  const response = await apiFetch("/billing/subscription", { method: "GET" });
  if (!response.ok) {
    throw new Error("Unable to load subscription status");
  }
  return response.json();
}

export async function createCheckoutSession(priceId: string, successUrl?: string, cancelUrl?: string): Promise<{ url: string }> {
  const body: Record<string, string> = { price_id: priceId };
  if (successUrl) body.success_url = successUrl;
  if (cancelUrl) body.cancel_url = cancelUrl;

  const response = await apiFetch("/billing/checkout", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to start checkout" }));
    throw new Error(error.detail || "Failed to start checkout");
  }

  const data = await response.json();
  return { url: data.url };
}

export async function createBillingPortalSession(returnUrl?: string): Promise<{ url: string }> {
  const response = await apiFetch("/billing/portal", {
    method: "POST",
    body: JSON.stringify({ return_url: returnUrl }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to open billing portal" }));
    throw new Error(error.detail || "Failed to open billing portal");
  }

  return response.json();
}

export async function cancelSubscription(): Promise<SubscriptionStatus> {
  const response = await apiFetch("/billing/cancel", { method: "POST" });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to cancel subscription" }));
    throw new Error(error.detail || "Failed to cancel subscription");
  }
  return response.json();
}

export async function resumeSubscription(): Promise<SubscriptionStatus> {
  const response = await apiFetch("/billing/resume", { method: "POST" });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to resume subscription" }));
    throw new Error(error.detail || "Failed to resume subscription");
  }
  return response.json();
}



