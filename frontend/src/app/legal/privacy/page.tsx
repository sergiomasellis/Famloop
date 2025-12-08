"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Lock,
  Eye,
  Trash2,
  Download,
  Mail,
  Globe,
  Users,
  Database,
  Clock,
  ArrowLeft,
} from "lucide-react";

export default function PrivacyPolicyPage() {
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
              <Shield className="size-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
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
            FamLoop (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy and the privacy of your family members, especially children. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our family calendar and chore management application.
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
              "Information We Collect",
              "How We Use Your Information",
              "Children's Privacy (COPPA)",
              "Data Storage and Security",
              "Data Sharing and Disclosure",
              "Your Rights (GDPR)",
              "Data Retention",
              "Cookies and Tracking",
              "Third-Party Services",
              "Changes to This Policy",
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

      {/* Section 1: Information We Collect */}
      <Card id="section-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Database className="size-5 text-primary" />
            1. Information We Collect
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Personal Information</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Account information: name, email address, password (hashed)</li>
              <li>Family member profiles: names, roles (parent/child), profile images or avatars</li>
              <li>Optional: age range of children for age-appropriate chore suggestions</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Usage Information</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Calendar events and schedules you create</li>
              <li>Chores, tasks, and completion status</li>
              <li>Points, goals, and reward tracking</li>
              <li>Activity logs and timestamps</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Technical Information</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Device information and browser type</li>
              <li>IP address (for security and rate limiting)</li>
              <li>Access times and request logs</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Third-Party Calendar Data</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Google Calendar events (when you connect your account)</li>
              <li>iCalendar feed data (when you add external calendars)</li>
              <li>Alexa reminders (when you connect Alexa)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: How We Use Your Information */}
      <Card id="section-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Eye className="size-5 text-primary" />
            2. How We Use Your Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">We use the information we collect to:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Provide, operate, and maintain FamLoop services</li>
            <li>Display your family calendar, events, and chores</li>
            <li>Track points and progress toward goals</li>
            <li>Generate age-appropriate chore suggestions using AI</li>
            <li>Sync with third-party calendar services you connect</li>
            <li>Send important account notifications</li>
            <li>Improve our services and user experience</li>
            <li>Ensure security and prevent fraud</li>
            <li>Comply with legal obligations</li>
          </ul>
        </CardContent>
      </Card>

      {/* Section 3: Children's Privacy */}
      <Card id="section-3" className="border-2 border-primary/20">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-3">
            <Users className="size-5 text-primary" />
            3. Children&apos;s Privacy (COPPA Compliance)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <p className="font-medium">
            FamLoop is designed for family use and may include children under 13. We are committed to complying with the Children&apos;s Online Privacy Protection Act (COPPA).
          </p>

          <div className="space-y-3">
            <h3 className="font-semibold">Parental Consent</h3>
            <p className="text-muted-foreground">
              Child accounts can only be created by a parent or guardian who has an account with FamLoop. By creating a child account, parents consent to the collection of limited information for their children.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Information Collected from Children</h3>
            <p className="text-muted-foreground">
              We collect only the minimum information necessary for children to use FamLoop:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Name (or nickname) chosen by the parent</li>
              <li>Profile image or avatar selected by parent or child</li>
              <li>Chore completion and point data</li>
            </ul>
            <p className="text-muted-foreground">
              We do <strong>not</strong> collect email addresses, precise location, or other personal identifiers from children.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Parental Rights</h3>
            <p className="text-muted-foreground">Parents can:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Review information collected about their children</li>
              <li>Delete their child&apos;s account and data at any time</li>
              <li>Refuse further collection of their child&apos;s information</li>
              <li>Manage all aspects of their child&apos;s account</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Data Storage and Security */}
      <Card id="section-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Lock className="size-5 text-primary" />
            4. Data Storage and Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            We implement industry-standard security measures to protect your information:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Passwords are hashed using bcrypt with proper salt rounds</li>
            <li>All data transmitted over HTTPS/TLS encryption</li>
            <li>JWT tokens for secure session management</li>
            <li>Rate limiting to prevent abuse and brute-force attacks</li>
            <li>Security headers (HSTS, CSP, X-Frame-Options)</li>
            <li>Regular security updates and vulnerability scanning</li>
            <li>Database access restricted to authorized services only</li>
          </ul>
          <p className="text-muted-foreground">
            While we strive to protect your information, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.
          </p>
        </CardContent>
      </Card>

      {/* Section 5: Data Sharing */}
      <Card id="section-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Globe className="size-5 text-primary" />
            5. Data Sharing and Disclosure
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="font-medium">
            We do not sell, trade, or rent your personal information to third parties.
          </p>
          <p className="text-muted-foreground">We may share information only in these circumstances:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong>Within your family:</strong> Information is shared among family members you invite to your family group</li>
            <li><strong>Service providers:</strong> Trusted third parties who assist in operating our service (hosting, analytics) under strict confidentiality agreements</li>
            <li><strong>Legal requirements:</strong> When required by law, court order, or government request</li>
            <li><strong>Safety:</strong> To protect the safety, rights, or property of our users or the public</li>
            <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets (you will be notified)</li>
          </ul>
        </CardContent>
      </Card>

      {/* Section 6: Your Rights (GDPR) */}
      <Card id="section-6" className="border-2 border-primary/20">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-3">
            <Shield className="size-5 text-primary" />
            6. Your Rights (GDPR &amp; Privacy Laws)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <p className="text-muted-foreground">
            If you are in the European Economic Area (EEA), UK, or other jurisdictions with similar privacy laws, you have the following rights:
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Eye className="size-4 text-primary" />
                <h4 className="font-semibold">Right to Access</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Request a copy of all personal data we hold about you.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Database className="size-4 text-primary" />
                <h4 className="font-semibold">Right to Rectification</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Request correction of inaccurate or incomplete data.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Trash2 className="size-4 text-primary" />
                <h4 className="font-semibold">Right to Erasure</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Request deletion of your personal data (&quot;right to be forgotten&quot;).
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Download className="size-4 text-primary" />
                <h4 className="font-semibold">Right to Portability</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Request your data in a portable, machine-readable format.
              </p>
            </div>
          </div>

          <p className="text-muted-foreground">
            To exercise these rights, contact us at the email address below. We will respond within 30 days.
          </p>

          <div className="p-4 rounded-lg bg-muted">
            <h4 className="font-semibold mb-2">Legal Basis for Processing (GDPR)</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li><strong>Contract:</strong> Processing necessary to provide our services</li>
              <li><strong>Consent:</strong> Where you have given explicit consent</li>
              <li><strong>Legitimate interests:</strong> For security, fraud prevention, and service improvement</li>
              <li><strong>Legal obligation:</strong> When required by law</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Section 7: Data Retention */}
      <Card id="section-7">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Clock className="size-5 text-primary" />
            7. Data Retention
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            We retain your personal information only as long as necessary for the purposes outlined in this policy:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-semibold">Data Type</th>
                  <th className="text-left py-2 font-semibold">Retention Period</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="py-2">Account information</td>
                  <td className="py-2">Until account deletion + 30 days</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Calendar events</td>
                  <td className="py-2">While account is active</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Chore history &amp; points</td>
                  <td className="py-2">While account is active</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Security logs</td>
                  <td className="py-2">90 days</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Backups</td>
                  <td className="py-2">30 days after data deletion</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-muted-foreground">
            When you delete your account, we will remove your personal data within 30 days, except where retention is required by law or for legitimate business purposes (e.g., resolving disputes).
          </p>
        </CardContent>
      </Card>

      {/* Section 8: Cookies */}
      <Card id="section-8">
        <CardHeader>
          <CardTitle>8. Cookies and Tracking Technologies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            FamLoop uses minimal cookies and similar technologies:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong>Essential cookies:</strong> Required for authentication and security (session tokens)</li>
            <li><strong>Preference cookies:</strong> Remember your settings (theme, language)</li>
            <li><strong>Local storage:</strong> Store app preferences on your device</li>
          </ul>
          <p className="text-muted-foreground">
            We do not use advertising cookies or third-party tracking for marketing purposes.
          </p>
        </CardContent>
      </Card>

      {/* Section 9: Third-Party Services */}
      <Card id="section-9">
        <CardHeader>
          <CardTitle>9. Third-Party Services</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            FamLoop may integrate with third-party services at your request:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong>Google Calendar:</strong> OAuth2 integration to sync your events</li>
            <li><strong>Amazon Alexa:</strong> To retrieve reminders (optional)</li>
            <li><strong>iCalendar feeds:</strong> External calendar subscriptions</li>
          </ul>
          <p className="text-muted-foreground">
            These services have their own privacy policies. We only access the minimum data necessary for integration and store tokens securely.
          </p>
        </CardContent>
      </Card>

      {/* Section 10: Changes */}
      <Card id="section-10">
        <CardHeader>
          <CardTitle>10. Changes to This Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            We may update this Privacy Policy from time to time. When we make material changes:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>We will update the &quot;Last Updated&quot; date at the top of this page</li>
            <li>We will notify you via email or in-app notification</li>
            <li>For significant changes, we may ask for renewed consent</li>
          </ul>
          <p className="text-muted-foreground">
            Your continued use of FamLoop after changes constitutes acceptance of the updated policy.
          </p>
        </CardContent>
      </Card>

      {/* Section 11: Contact */}
      <Card id="section-11">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Mail className="size-5 text-primary" />
            11. Contact Us
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:
          </p>
          <div className="p-4 rounded-lg bg-muted space-y-2">
            <p><strong>Email:</strong> privacy@famloop.app</p>
            <p><strong>Subject Line:</strong> Privacy Inquiry - FamLoop</p>
          </div>
          <p className="text-muted-foreground">
            For GDPR-related requests, please include &quot;GDPR Request&quot; in the subject line. We will respond within 30 days.
          </p>
          <p className="text-muted-foreground">
            If you believe your privacy rights have been violated, you have the right to lodge a complaint with your local data protection authority.
          </p>
        </CardContent>
      </Card>

      {/* Footer navigation */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center py-8 border-t">
        <Button asChild variant="outline">
          <Link href="/">Back to Home</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/legal/terms">View Terms of Service →</Link>
        </Button>
      </div>
    </div>
  );
}

