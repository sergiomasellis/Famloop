"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground">FamLoop</h1>
      </div>

      <div className="border-4 border-border shadow-[8px_8px_0px_0px_var(--shadow-color)] rounded-xl bg-card overflow-hidden">
        <div className="border-b-4 border-border bg-primary/20 p-6">
          <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">Sign in</h2>
          <p className="text-base font-medium text-muted-foreground mt-1">
            Enter your account details
          </p>
        </div>
        <div className="p-6 flex justify-center">
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent shadow-none border-0 p-0 w-full",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "h-12 w-full border-2 border-border text-lg font-bold uppercase shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all bg-card text-foreground",
                socialButtonsBlockButtonText: "font-bold",
                dividerLine: "bg-border",
                dividerText: "text-muted-foreground font-bold uppercase text-sm",
                formFieldLabel: "text-sm font-bold uppercase text-foreground",
                formFieldInput:
                  "h-12 border-2 border-border bg-input text-foreground text-base shadow-[4px_4px_0px_0px_var(--shadow-color)] focus:ring-0 focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none transition-all placeholder:text-muted-foreground",
                formButtonPrimary:
                  "h-12 w-full border-2 border-border bg-primary text-primary-foreground text-lg font-bold uppercase shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-primary/90 transition-all",
                footerAction: "hidden",
                footer: "hidden",
                formFieldAction: "text-foreground font-bold text-sm hover:underline",
                identityPreviewEditButton: "text-primary font-bold",
                formResendCodeLink: "text-primary font-bold",
                otpCodeFieldInput:
                  "border-2 border-border bg-input text-foreground shadow-[2px_2px_0px_0px_var(--shadow-color)]",
                alertText: "text-destructive font-bold",
                formFieldErrorText: "text-destructive font-bold text-sm",
              },
              layout: {
                socialButtonsPlacement: "top",
                socialButtonsVariant: "blockButton",
              },
            }}
            routing="path"
            path="/auth/login"
            signUpUrl="/auth/signup"
            forceRedirectUrl="/calendar"
          />
        </div>
        <div className="p-6 pt-0 text-center">
          <p className="text-sm font-bold text-foreground">
            You don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-primary hover:underline decoration-2 underline-offset-2">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
