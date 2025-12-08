"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { generateQRCodeSession, checkQRCodeStatus } from "@/lib/api";

// Dynamically import QRCodeSVG to avoid SSR issues and module resolution problems
const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((mod) => mod.QRCodeSVG),
  { 
    ssr: false,
    loading: () => (
      <div className="w-64 h-64 border-4 border-border bg-card rounded-xl shadow-[4px_4px_0px_0px_var(--shadow-color)] flex items-center justify-center">
        <div className="text-lg font-bold text-muted-foreground">Loading QR code...</div>
      </div>
    )
  }
);

interface QRCodeLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QRCodeLoginDialog({ open, onOpenChange }: QRCodeLoginDialogProps) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "pending" | "scanned" | "expired" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const generateSession = useCallback(async () => {
    try {
      setStatus("loading");
      setError(null);
      const response = await generateQRCodeSession();
      setSessionToken(response.session_token);
      setQrCodeUrl(response.qr_code_url);
      setStatus("pending");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate QR code");
      setStatus("error");
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      if (!sessionToken) return;

      try {
        const response = await checkQRCodeStatus(sessionToken);
        
        if (response.status === "scanned" && response.access_token) {
          // QR code was scanned, log in the user
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          // Store token
          localStorage.setItem("auth_token", response.access_token);
          setStatus("scanned");
          
          // Redirect to dashboard after a brief delay
          setTimeout(() => {
            onOpenChange(false);
            // Force a full page reload to refresh auth state
            window.location.href = "/dashboard";
          }, 1000);
        } else if (response.status === "expired") {
          setStatus("expired");
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      } catch (err) {
        console.error("Error checking QR code status:", err);
        // Continue polling on error
      }
    }, 2000); // Poll every 2 seconds
  }, [sessionToken, onOpenChange]);

  // Generate QR code session when dialog opens
  useEffect(() => {
    if (open) {
      generateSession();
    } else {
      // Clean up when dialog closes
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setSessionToken(null);
      setQrCodeUrl(null);
      setStatus("loading");
      setError(null);
    }
  }, [open, generateSession]);

  // Poll for status when session token is available
  useEffect(() => {
    if (sessionToken && status === "pending") {
      startPolling();
    }
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [sessionToken, status, startPolling]);

  const handleRetry = () => {
    generateSession();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-tight text-foreground">
            Scan QR Code
          </DialogTitle>
          <DialogDescription className="text-base font-medium text-muted-foreground">
            {status === "loading" && "Generating QR code..."}
            {status === "pending" && "Scan this QR code with your mobile app to log in"}
            {status === "scanned" && "Success! Logging you in..."}
            {status === "expired" && "QR code expired. Please generate a new one."}
            {status === "error" && "Failed to generate QR code. Please try again."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-4">
          {status === "loading" && (
            <div className="flex items-center justify-center w-64 h-64 border-4 border-border bg-card rounded-xl shadow-[4px_4px_0px_0px_var(--shadow-color)]">
              <div className="text-lg font-bold text-muted-foreground">Loading...</div>
            </div>
          )}

          {status === "pending" && qrCodeUrl && (
            <div className="p-4 border-4 border-border bg-card rounded-xl shadow-[8px_8px_0px_0px_var(--shadow-color)]">
              <QRCodeSVG
                value={qrCodeUrl}
                size={256}
                level="H"
                includeMargin={true}
                className="border-2 border-border rounded-lg"
              />
            </div>
          )}

          {status === "scanned" && (
            <div className="flex items-center justify-center w-64 h-64 border-4 border-primary bg-primary/10 rounded-xl shadow-[4px_4px_0px_0px_var(--shadow-color)]">
              <div className="text-lg font-bold text-primary">✓ Success!</div>
            </div>
          )}

          {(status === "expired" || status === "error") && (
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 text-sm font-bold text-destructive bg-destructive/10 border-2 border-destructive rounded-md">
                {status === "expired" ? "QR code has expired" : error || "An error occurred"}
              </div>
              <Button
                onClick={handleRetry}
                className="h-12 border-2 border-border bg-primary text-primary-foreground text-lg font-bold uppercase shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-primary/90 transition-all"
              >
                Generate New QR Code
              </Button>
            </div>
          )}

          {status === "pending" && (
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-sm font-bold text-muted-foreground">Waiting for scan...</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Open the FamLoop app on your phone and scan this code
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

