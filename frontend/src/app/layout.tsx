import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/features/shell/AppShell";
import { ThemeProvider } from "@/components/theme-provider";
import { ConvexClientProvider } from "./providers";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FamLoop",
  description: "Family calendar, chores, and rewards",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  applicationName: "FamLoop",
  appleWebApp: { title: "FamLoop", capable: true, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ConvexClientProvider>
          <AuthProvider>
            <ThemeProvider
              defaultTheme="system"
              storageKey="famloop-ui-theme"
            >
              <ErrorBoundaryWrapper>
                <AppShell>{children}</AppShell>
              </ErrorBoundaryWrapper>
            </ThemeProvider>
          </AuthProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
