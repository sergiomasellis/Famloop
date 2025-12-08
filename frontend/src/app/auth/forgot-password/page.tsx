"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { forgotPassword } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request password reset");
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
          <CardHeader className="space-y-1 border-b-4 border-border bg-primary/20 p-6">
            <CardTitle className="text-3xl font-black uppercase tracking-tight text-foreground">Forgot Password</CardTitle>
            <CardDescription className="text-base font-medium text-muted-foreground">
              Enter your email to receive a password reset link
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-8">
            {success ? (
              <div className="space-y-6">
                <div className="p-4 text-sm font-bold text-primary bg-primary/10 border-2 border-primary rounded-md">
                  If an account with that email exists, a password reset link has been sent. Please check your email.
                </div>
                <Button 
                  onClick={() => router.push("/auth/login")}
                  className="h-12 w-full border-2 border-border bg-primary text-primary-foreground text-lg font-bold uppercase shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-primary/90 transition-all"
                >
                  Back to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 text-sm font-bold text-destructive bg-destructive/10 border-2 border-destructive rounded-md">
                    {error}
                  </div>
                )}
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

                <Button 
                  type="submit" 
                  className="h-12 w-full border-2 border-border bg-primary text-primary-foreground text-lg font-bold uppercase shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-primary/90 transition-all" 
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>

                <p className="text-center text-sm font-bold text-foreground">
                  Remember your password?{" "}
                  <Link href="/auth/login" className="text-primary hover:underline decoration-2 underline-offset-2">
                    Sign in
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
    </div>
  );
}

