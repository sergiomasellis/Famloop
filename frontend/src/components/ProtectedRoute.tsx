"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useAuth } from "@/contexts/AuthContext";
import { useFamily } from "@/hooks/useFamily";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded: clerkLoaded, isSignedIn } = useUser();
  const { user, loading: convexLoading } = useAuth();
  const { family, loading: familyLoading } = useFamily();
  const router = useRouter();
  const pathname = usePathname();

  // Combined loading state
  const loading = !clerkLoaded || convexLoading || familyLoading;

  // Check if we're already on an onboarding page
  const isOnboardingPage = pathname?.startsWith("/onboarding");

  useEffect(() => {
    // If Clerk finished loading and user is not signed in, redirect to login
    if (clerkLoaded && !isSignedIn) {
      router.push("/auth/login");
      return;
    }

    // If user is signed in, data is loaded, and they don't have a family,
    // redirect to onboarding (unless already there)
    if (clerkLoaded && isSignedIn && !familyLoading && !family && !isOnboardingPage) {
      router.push("/onboarding/family");
    }
  }, [clerkLoaded, isSignedIn, familyLoading, family, isOnboardingPage, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // User is not signed in with Clerk
  if (!isSignedIn) {
    return null;
  }

  // If user doesn't have a family and is not on onboarding, show nothing (redirect will happen)
  if (!family && !isOnboardingPage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Redirecting to setup...</div>
      </div>
    );
  }

  // User is signed in with Clerk and either has a family or is on onboarding
  return <>{children}</>;
}
