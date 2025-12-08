"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { QRCodeLoginDialog } from "@/components/QRCodeLoginDialog";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

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

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
            <CardTitle className="text-3xl font-black uppercase tracking-tight text-foreground">Sign in</CardTitle>
            <CardDescription className="text-base font-medium text-muted-foreground">
              Enter your account details or use QR code
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
                    disabled={loading}
                    className="h-12 border-2 border-border bg-input text-foreground text-base shadow-[4px_4px_0px_0px_var(--shadow-color)] focus-visible:ring-0 focus-visible:translate-x-[2px] focus-visible:translate-y-[2px] focus-visible:shadow-none transition-all placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="remember" 
                    className="h-5 w-5 rounded border-2 border-border text-primary focus:ring-0 shadow-[2px_2px_0px_0px_var(--shadow-color)] bg-input accent-primary"
                  />
                  <label htmlFor="remember" className="text-sm font-bold cursor-pointer select-none text-foreground">Remember me</label>
                </div>
                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm font-bold hover:underline decoration-2 underline-offset-2 text-foreground"
                >
                  Recover password
                </Link>
              </div>

              <Button 
                type="submit" 
                className="h-12 w-full border-2 border-border bg-primary text-primary-foreground text-lg font-bold uppercase shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-primary/90 transition-all" 
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t-2 border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 font-bold text-muted-foreground border-2 border-border rounded-full">
                    or
                  </span>
                </div>
              </div>

              <Button 
                type="button" 
                variant="outline"
                onClick={() => setQrCodeDialogOpen(true)}
                className="h-12 w-full border-2 border-border bg-transparent text-foreground text-lg font-bold shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-accent transition-all"
              >
                Log in with QR code
              </Button>

              <p className="text-center text-sm font-bold text-foreground">
                You don&apos;t have an account?{" "}
                <Link href="/auth/signup" className="text-primary hover:underline decoration-2 underline-offset-2">
                  Create an account
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      
      <QRCodeLoginDialog open={qrCodeDialogOpen} onOpenChange={setQrCodeDialogOpen} />
    </div>
  );
}
