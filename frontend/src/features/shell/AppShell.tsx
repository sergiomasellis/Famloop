"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";

type AppShellProps = {
  children: React.ReactNode;
};

/**
 * AppShell wraps pages with the global header and provides
 * touch-friendly padding and responsive container.
 */
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith("/auth");
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  React.useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const backgroundImage = isAuthRoute
    ? isDarkMode
      ? "url(/HERO_BG_DARK.png)"
      : "url(/HERO_BG.png)"
    : undefined;

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <Header />
      <main 
        className={isAuthRoute ? "flex-1 flex flex-col items-center justify-center p-4 bg-cover bg-center bg-no-repeat bg-fixed relative overflow-auto" : "flex-1 overflow-auto"}
        style={isAuthRoute ? {
          backgroundImage,
          backgroundColor: '#e9e1f3'
        } : undefined}
      >
        {isAuthRoute && (
          <div className="absolute inset-0 bg-[#e9e1f3]/60 pointer-events-none" />
        )}
        {isAuthRoute ? (
          <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-full">
            {children}
          </div>
        ) : (
          <div className="mx-auto w-full max-w-7xl px-3 py-3 sm:px-4 sm:py-4 md:py-6 touch-pan-y">
            {children}
          </div>
        )}
      </main>
      <footer className="hidden md:block border-t-2 border-border bg-muted/30">
        <div className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-semibold">FamLoop</span>
              <span>•</span>
              <span>© {new Date().getFullYear()}</span>
            </div>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/legal/privacy"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link
                href="/legal/terms"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default AppShell;