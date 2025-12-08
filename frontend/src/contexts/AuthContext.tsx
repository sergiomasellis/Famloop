"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { SubscriptionStatus } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export type User = {
  id: number;
  name: string;
  email: string | null;
  role: "parent" | "child";
  family_id: number | null;
  profile_image_url?: string | null;
  created_at: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  subscription: SubscriptionStatus | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role?: "parent" | "child") => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Load token and user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      setToken(storedToken);
      // Fetch user info
      fetchUser(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchSubscription = async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/billing/subscription`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const sub: SubscriptionStatus = await res.json();
        setSubscription(sub);
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
      setSubscription(null);
    }
  };

  const fetchUser = async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        const userData: User = await res.json();
        setUser(userData);
        await fetchSubscription(authToken);
      } else {
        // Token is invalid, clear it
        localStorage.removeItem("auth_token");
        setToken(null);
        setUser(null);
        setSubscription(null);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      localStorage.removeItem("auth_token");
      setToken(null);
      setUser(null);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        let errorMessage = "Login failed";
        try {
          const error = await res.json();
          errorMessage = error.detail || error.message || "Login failed";
        } catch {
          errorMessage = res.statusText || "Login failed";
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      const authToken = data.access_token;
      
      if (!authToken) {
        throw new Error("No access token received");
      }
      
      localStorage.setItem("auth_token", authToken);
      setToken(authToken);
      await fetchUser(authToken);
    } catch (error) {
      // Re-throw with better error message if it's a network error
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("Network error: Could not connect to server. Please check if the backend is running.");
      }
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string, role: "parent" | "child" = "parent") => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Signup failed" }));
      throw new Error(error.detail || "Signup failed");
    }

    const data = await res.json();
    const authToken = data.access_token;
    
    localStorage.setItem("auth_token", authToken);
    setToken(authToken);
    await fetchUser(authToken);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
    setSubscription(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        subscription,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

