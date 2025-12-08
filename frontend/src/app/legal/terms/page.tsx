"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Users,
  Shield,
  AlertTriangle,
  Scale,
  Ban,
  Gavel,
  Mail,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";

export default function TermsOfServicePage() {
  const lastUpdated = "November 29, 2025";
  const effectiveDate = "November 29, 2025";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="size-4" />
            Back to Home
          </Link>
        </Button>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <FileText className="size-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
              <p className="text-muted-foreground">
                Last updated: {lastUpdated}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <Card>
        <CardContent className="pt-6 prose dark:prose-invert max-w-none">
          <p className="text-lg leading-relaxed">
            Welcome to FamLoop! These Terms of Service (&quot;Terms&quot;) govern your access to and use of the FamLoop application and services. By creating an account or using FamLoop, you agree to be bound by these Terms.
          </p>
          <p className="text-muted-foreground">
            Effective Date: {effectiveDate}
          </p>
        </CardContent>
      </Card>

      {/* Table of Contents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Table of Contents</CardTitle>
        </CardHeader>
        <CardContent>
          <nav className="grid gap-2 sm:grid-cols-2">
            {[
              "Acceptance of Terms",
              "Description of Service",
              "Account Registration",
              "Family Accounts & Children",
              "Acceptable Use",
              "Prohibited Activities",
              "Intellectual Property",
              "Third-Party Integrations",
              "Disclaimers & Limitations",
              "Indemnification",
              "Termination",
              "Governing Law",
              "Changes to Terms",
              "Contact Us",
            ].map((item, index) => (
              <a
                key={item}
                href={`#section-${index + 1}`}
                className="text-primary hover:underline flex items-center gap-2"
              >
                <span className="text-muted-foreground text-sm">{index + 1}.</span>
                {item}
              </a>
            ))}
          </nav>
        </CardContent>
      </Card>

      {/* Section 1: Acceptance */}
      <Card id="section-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <CheckCircle className="size-5 text-primary" />
            1. Acceptance of Terms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            By accessing or using FamLoop, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.
          </p>
          <p className="text-muted-foreground">
            If you do not agree to these Terms, you may not access or use our services. If you are accepting these Terms on behalf of a family or organization, you represent that you have the authority to bind them to these Terms.
          </p>
          <div className="p-4 rounded-lg bg-muted">
            <p className="font-medium">
              You must be at least 18 years old (or the age of majority in your jurisdiction) to create a parent/admin account on FamLoop.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Description of Service */}
      <Card id="section-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <FileText className="size-5 text-primary" />
            2. Description of Service
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            FamLoop is a family calendar and household management application that provides:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Shared family calendar with event management</li>
            <li>Chore assignment and tracking with point systems</li>
            <li>Leaderboards and reward goal tracking</li>
            <li>Integration with third-party calendar services</li>
            <li>AI-powered chore suggestions</li>
            <li>Multi-user family accounts with parent and child roles</li>
          </ul>
          <p className="text-muted-foreground">
            We reserve the right to modify, suspend, or discontinue any aspect of the service at any time, with or without notice.
          </p>
        </CardContent>
      </Card>

      {/* Section 3: Account Registration */}
      <Card id="section-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Users className="size-5 text-primary" />
            3. Account Registration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            To use FamLoop, you must create an account. When registering, you agree to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Provide accurate, current, and complete information</li>
            <li>Maintain the security of your password and account</li>
            <li>Accept responsibility for all activities under your account</li>
            <li>Notify us immediately of any unauthorized access</li>
            <li>Not share your account credentials with others</li>
          </ul>
          <p className="text-muted-foreground">
            We reserve the right to suspend or terminate accounts that violate these Terms or contain false information.
          </p>
        </CardContent>
      </Card>

      {/* Section 4: Family Accounts & Children */}
      <Card id="section-4" className="border-2 border-primary/20">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-3">
            <Users className="size-5 text-primary" />
            4. Family Accounts &amp; Children
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <p className="font-medium">
            FamLoop is designed for family use, including children under 13.
          </p>

          <div className="space-y-3">
            <h3 className="font-semibold">Parent Responsibilities</h3>
            <p className="text-muted-foreground">As a parent or guardian creating a family group, you:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Consent to the collection of your children&apos;s information as described in our Privacy Policy</li>
              <li>Are responsible for supervising your children&apos;s use of FamLoop</li>
              <li>Agree that any rewards or goals set are between you and your family</li>
              <li>May manage, modify, or delete child accounts at any time</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Child Accounts</h3>
            <p className="text-muted-foreground">
              Child accounts have limited functionality and cannot:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Access administrative or family settings</li>
              <li>Invite new family members</li>
              <li>Create or modify goals and rewards</li>
              <li>Delete family data</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Acceptable Use */}
      <Card id="section-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Shield className="size-5 text-primary" />
            5. Acceptable Use
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            You agree to use FamLoop only for lawful purposes and in accordance with these Terms. You agree to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Use the service only for personal, non-commercial family management</li>
            <li>Respect the privacy and rights of your family members</li>
            <li>Keep your account information up to date</li>
            <li>Use the service in compliance with all applicable laws</li>
            <li>Not interfere with or disrupt the service or servers</li>
          </ul>
        </CardContent>
      </Card>

      {/* Section 6: Prohibited Activities */}
      <Card id="section-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Ban className="size-5 text-destructive" />
            6. Prohibited Activities
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            You may not use FamLoop to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Violate any applicable law or regulation</li>
            <li>Impersonate any person or entity</li>
            <li>Harass, abuse, or harm another person</li>
            <li>Upload malicious code, viruses, or harmful content</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Scrape, data mine, or collect user information</li>
            <li>Use automated systems (bots) to access the service</li>
            <li>Interfere with security features or circumvent access controls</li>
            <li>Use the service for commercial purposes without authorization</li>
            <li>Encourage or enable others to do any of the above</li>
          </ul>
        </CardContent>
      </Card>

      {/* Section 7: Intellectual Property */}
      <Card id="section-7">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Scale className="size-5 text-primary" />
            7. Intellectual Property
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-semibold">Our Content</h3>
            <p className="text-muted-foreground">
              FamLoop and its original content, features, and functionality are owned by us and are protected by copyright, trademark, and other intellectual property laws. The FamLoop name, logo, and all related marks are our trademarks.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Your Content</h3>
            <p className="text-muted-foreground">
              You retain ownership of any content you create within FamLoop (events, chores, notes, images). By using FamLoop, you grant us a limited license to store, display, and process your content solely to provide the service.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Feedback</h3>
            <p className="text-muted-foreground">
              Any feedback, suggestions, or ideas you provide about FamLoop may be used by us without any obligation to you.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 8: Third-Party Integrations */}
      <Card id="section-8">
        <CardHeader>
          <CardTitle>8. Third-Party Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            FamLoop may integrate with third-party services (Google Calendar, Amazon Alexa, etc.). By connecting these services:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>You authorize us to access your data on those platforms as described</li>
            <li>You agree to comply with those services&apos; terms of service</li>
            <li>You understand we are not responsible for third-party service availability or changes</li>
            <li>You can disconnect integrations at any time through your account settings</li>
          </ul>
        </CardContent>
      </Card>

      {/* Section 9: Disclaimers */}
      <Card id="section-9">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <AlertTriangle className="size-5 text-yellow-600" />
            9. Disclaimers &amp; Limitations of Liability
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              FAMLOOP IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
            </p>
          </div>

          <p className="text-muted-foreground">We do not warrant that:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>The service will be uninterrupted, secure, or error-free</li>
            <li>Results from the service will be accurate or reliable</li>
            <li>The service will meet your specific requirements</li>
            <li>Any errors will be corrected</li>
          </ul>

          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">
              <strong>Limitation of Liability:</strong> To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or goodwill arising from your use of FamLoop.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 10: Indemnification */}
      <Card id="section-10">
        <CardHeader>
          <CardTitle>10. Indemnification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            You agree to indemnify, defend, and hold harmless FamLoop and its affiliates, officers, directors, employees, and agents from any claims, damages, losses, liabilities, costs, or expenses arising from:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Your use of or access to the service</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any third-party rights</li>
            <li>Any content you submit or transmit through the service</li>
          </ul>
        </CardContent>
      </Card>

      {/* Section 11: Termination */}
      <Card id="section-11">
        <CardHeader>
          <CardTitle>11. Termination</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-semibold">By You</h3>
            <p className="text-muted-foreground">
              You may terminate your account at any time by contacting us or using the account deletion feature. Upon termination, your data will be deleted according to our Privacy Policy.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">By Us</h3>
            <p className="text-muted-foreground">
              We may suspend or terminate your access to FamLoop at any time, with or without cause, with or without notice. Reasons may include:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Violation of these Terms</li>
              <li>Conduct that harms other users or the service</li>
              <li>Extended periods of inactivity</li>
              <li>Legal or regulatory requirements</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Effect of Termination</h3>
            <p className="text-muted-foreground">
              Upon termination, your right to use FamLoop immediately ceases. Provisions that by their nature should survive termination will survive (including intellectual property, disclaimers, and limitations of liability).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 12: Governing Law */}
      <Card id="section-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Gavel className="size-5 text-primary" />
            12. Governing Law &amp; Disputes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which FamLoop operates, without regard to its conflict of law provisions.
          </p>
          <p className="text-muted-foreground">
            Any disputes arising from these Terms or your use of FamLoop shall be resolved through:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Good faith negotiation between the parties</li>
            <li>Mediation, if negotiation fails</li>
            <li>Binding arbitration or court proceedings as a last resort</li>
          </ol>
          <p className="text-muted-foreground">
            You agree to bring any claims in your individual capacity, not as a class member or representative.
          </p>
        </CardContent>
      </Card>

      {/* Section 13: Changes */}
      <Card id="section-13">
        <CardHeader>
          <CardTitle>13. Changes to Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            We reserve the right to modify these Terms at any time. When we make changes:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>We will update the &quot;Last Updated&quot; date at the top of this page</li>
            <li>For material changes, we will provide notice via email or in-app notification</li>
            <li>Your continued use after changes constitutes acceptance</li>
            <li>If you disagree with changes, you must stop using the service</li>
          </ul>
          <p className="text-muted-foreground">
            We encourage you to review these Terms periodically for any updates.
          </p>
        </CardContent>
      </Card>

      {/* Section 14: Contact */}
      <Card id="section-14">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Mail className="size-5 text-primary" />
            14. Contact Us
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            If you have questions or concerns about these Terms of Service, please contact us:
          </p>
          <div className="p-4 rounded-lg bg-muted space-y-2">
            <p><strong>Email:</strong> legal@famloop.app</p>
            <p><strong>Subject Line:</strong> Terms Inquiry - FamLoop</p>
          </div>
          <p className="text-muted-foreground">
            We will make reasonable efforts to respond to your inquiry within a reasonable timeframe.
          </p>
        </CardContent>
      </Card>

      {/* Acknowledgment */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            By using FamLoop, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our{" "}
            <Link href="/legal/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </CardContent>
      </Card>

      {/* Footer navigation */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center py-8 border-t">
        <Button asChild variant="outline">
          <Link href="/">Back to Home</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/legal/privacy">← View Privacy Policy</Link>
        </Button>
      </div>
    </div>
  );
}

