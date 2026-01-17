"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

function makeConvexClient() {
  return new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => makeConvexClient(), []);

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
