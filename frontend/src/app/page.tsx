import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Trophy,
  Shield,
  Users,
  CheckCircle,
  Target,
  Heart,
  Sparkles,
  ArrowRight,
  Star
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Sparkles className="size-4" />
          Family Management Made Simple
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Weave Your Family&apos;s
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"> Story Together</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Transform family life with shared calendars, chore management, and reward systems.
            Create lasting memories while teaching responsibility and teamwork.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button asChild size="lg" className="text-lg px-8 py-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              Get Started
              <ArrowRight className="size-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
            <Link href="/auth/signup" className="flex items-center gap-2">
              <Users className="size-5" />
              Join Family
            </Link>
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">Everything Your Family Needs</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Powerful tools designed to bring families closer and make household management effortless.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <CalendarDays className="size-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Weekly Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                View family events, assign chores, and track progress all in one beautiful, organized view.
              </p>
              <Button asChild className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Link href="/dashboard" className="flex items-center justify-center gap-2">
                  Open Dashboard
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center group-hover:bg-orange-200 dark:group-hover:bg-orange-900/30 transition-colors">
                <CheckCircle className="size-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-xl">Chore Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Create, assign, and track chores with point values. Teach responsibility while keeping everyone accountable.
              </p>
              <Button asChild variant="secondary" className="w-full">
                <Link href="/dashboard#chores" className="flex items-center justify-center gap-2">
                  Manage Chores
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/30 transition-colors">
                <Trophy className="size-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <CardTitle className="text-xl">Leaderboard & Rewards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Track points earned from chores and celebrate achievements. Set goals and create family traditions.
              </p>
              <Button asChild variant="secondary" className="w-full">
                <Link href="/leaderboard" className="flex items-center justify-center gap-2">
                  View Leaderboard
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/30 transition-colors">
                <Users className="size-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-xl">Family Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Add family members, customize profiles, and manage roles. Keep everyone connected and organized.
              </p>
              <Button asChild variant="secondary" className="w-full">
                <Link href="/dashboard?family" className="flex items-center justify-center gap-2">
                  Manage Family
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/30 transition-colors">
                <Target className="size-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-xl">Goal Setting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Set family goals and track progress together. Celebrate milestones and create lasting family traditions.
              </p>
              <Button asChild variant="secondary" className="w-full">
                <Link href="/dashboard" className="flex items-center justify-center gap-2">
                  Set Goals
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/30 transition-colors">
                <Shield className="size-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-xl">Admin & Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Manage integrations, family settings, and advanced features. Full control over your family&apos;s experience.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin" className="flex items-center justify-center gap-2">
                  Admin Panel
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="space-y-6">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">Simple Pricing</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free, upgrade when you need recurring chores, more kids, or integrations.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Free</CardTitle>
                <Badge variant="outline">Start here</Badge>
              </div>
              <p className="text-3xl font-bold"> $0 </p>
              <p className="text-muted-foreground">1 family, up to 2 kids</p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <ul className="space-y-2">
                <li>Basic calendar and chores</li>
                <li>Points and rewards</li>
                <li>Great for trying FamLoop</li>
              </ul>
              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/signup">Get started</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/40 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Family Plus</CardTitle>
                <Badge>Popular</Badge>
              </div>
              <p className="text-3xl font-bold">$10/mo</p>
              <p className="text-muted-foreground">1 family, up to 6 kids</p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <ul className="space-y-2">
                <li>All Free features</li>
                <li>Recurring chores + calendar sharing</li>
                <li>Rewards & deeper reporting</li>
              </ul>
              <Button asChild className="w-full">
                <Link href="/pricing">See details</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Family Pro</CardTitle>
                <Badge variant="secondary">Best value</Badge>
              </div>
              <p className="text-3xl font-bold">$18/mo</p>
              <p className="text-muted-foreground">Unlimited kids + integrations</p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <ul className="space-y-2">
                <li>All Plus features</li>
                <li>Integrations (Google/ICS) and priority support</li>
                <li>Annual discount available</li>
              </ul>
              <Button asChild variant="outline" className="w-full">
                <Link href="/pricing">See details</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center space-y-6 py-12 bg-muted/30 rounded-2xl">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">Ready to Transform Your Family Life?</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Join thousands of families who are already creating stronger bonds and better habits together.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button asChild size="lg" className="text-lg px-8 py-6">
            <Link href="/auth/signup" className="flex items-center gap-2">
              <Heart className="size-5" />
              Start Your Family Journey
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="text-lg px-8 py-6">
            <Link href="/auth/login" className="flex items-center gap-2">
              <Star className="size-5" />
              Sign In
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
