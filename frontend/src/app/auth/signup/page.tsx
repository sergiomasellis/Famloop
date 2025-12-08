"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [skipAutoRedirect, setSkipAutoRedirect] = useState(false);
  const { signup, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && !skipAutoRedirect) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, authLoading, router, skipAutoRedirect]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-2xl font-black border-4 border-border p-4 bg-card text-card-foreground shadow-[4px_4px_0px_0px_var(--shadow-color)]">Loading...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSkipAutoRedirect(true);

    try {
      // Only parents can sign up, so role is always "parent"
      await signup(name, email, password, "parent");
      router.push("/onboarding/family");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
      setSkipAutoRedirect(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground">FamLoop</h1>
        </div>

        <Card className="border-4 border-border shadow-[8px_8px_0px_0px_var(--shadow-color)] rounded-xl bg-card overflow-hidden">
          <CardHeader className="space-y-1 border-b-4 border-border bg-accent/20 p-6">
            <CardTitle className="text-3xl font-black uppercase tracking-tight text-foreground">Sign up</CardTitle>
            <CardDescription className="text-base font-medium text-muted-foreground">
              Before we start, please enter your details
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm font-bold text-destructive bg-destructive/10 border-2 border-destructive rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase text-foreground" htmlFor="name">Full Name</label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 border-2 border-border bg-input text-foreground text-base shadow-[4px_4px_0px_0px_var(--shadow-color)] focus-visible:ring-0 focus-visible:translate-x-[2px] focus-visible:translate-y-[2px] focus-visible:shadow-none transition-all placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase text-foreground" htmlFor="email">Email</label>
                  <Input
                    id="email"
                    placeholder="email@gmail.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 border-2 border-border bg-input text-foreground text-base shadow-[4px_4px_0px_0px_var(--shadow-color)] focus-visible:ring-0 focus-visible:translate-x-[2px] focus-visible:translate-y-[2px] focus-visible:shadow-none transition-all placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase text-foreground" htmlFor="password">Password</label>
                  <Input
                    id="password"
                    placeholder="Enter your password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                    className="h-12 border-2 border-border bg-input text-foreground text-base shadow-[4px_4px_0px_0px_var(--shadow-color)] focus-visible:ring-0 focus-visible:translate-x-[2px] focus-visible:translate-y-[2px] focus-visible:shadow-none transition-all placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="updates" 
                    className="h-5 w-5 rounded border-2 border-border text-accent focus:ring-0 shadow-[2px_2px_0px_0px_var(--shadow-color)] bg-input accent-accent"
                    defaultChecked
                  />
                  <label htmlFor="updates" className="text-sm font-bold cursor-pointer select-none leading-tight text-foreground">
                    I agree to receive email updates
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="terms" 
                    className="h-5 w-5 rounded border-2 border-border text-accent focus:ring-0 shadow-[2px_2px_0px_0px_var(--shadow-color)] bg-input accent-accent"
                    required
                  />
                  <label htmlFor="terms" className="text-sm font-bold cursor-pointer select-none leading-tight text-foreground">
                    I have read and agree to Terms of Service
                  </label>
                </div>
              </div>

              <Button 
                type="submit" 
                className="h-12 w-full border-2 border-border bg-primary text-primary-foreground text-lg font-bold uppercase shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-primary/90 transition-all" 
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create account"}
              </Button>

              <p className="text-center text-sm font-bold text-foreground">
                Already registered?{" "}
                <Link href="/auth/login" className="text-primary hover:underline decoration-2 underline-offset-2">
                  Sign in to your account
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
    </div>
  );
}
