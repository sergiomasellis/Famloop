"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Trophy,
  Shield,
  Users,
  CheckCircle,
  Target,
  Sparkles,
  ArrowRight,
  Star,
  Zap,
  Heart,
  PartyPopper,
  Crown,
  Rocket,
  Gift,
  Clock,
  TrendingUp,
  Play,
  ChevronDown,
} from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useScrollReveal, useScrollProgress, useParallax } from "@/hooks/useScrollReveal";

// Scroll progress indicator
function ScrollProgressBar() {
  const progress = useScrollProgress();

  return (
    <div
      className="fixed top-0 left-0 h-1 bg-primary z-[9999] origin-left"
      style={{ transform: `scaleX(${progress})` }}
    />
  );
}

// Animated background shapes
function FloatingShapes() {
  const parallax1 = useParallax(0.1);
  const parallax2 = useParallax(0.15);
  const parallax3 = useParallax(0.08);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Large morphing shape */}
      <div
        className="absolute -top-20 -right-20 w-96 h-96 bg-primary/5 shape-morph"
        style={{ transform: `translateY(${parallax1}px)` }}
      />
      {/* Medium shape */}
      <div
        className="absolute top-1/3 -left-10 w-64 h-64 bg-secondary/5 rounded-full animate-float-slow"
        style={{ transform: `translateY(${parallax2}px)` }}
      />
      {/* Small accent */}
      <div
        className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-accent/5 rounded-2xl rotate-45 animate-float-medium"
        style={{ transform: `translateY(${parallax3}px) rotate(45deg)` }}
      />
    </div>
  );
}

// Floating emoji with parallax
function FloatingEmoji({ emoji, className, speed = 0.1 }: { emoji: string; className?: string; speed?: number }) {
  const offset = useParallax(speed);

  return (
    <div
      className={`absolute text-4xl md:text-6xl pointer-events-none select-none ${className}`}
      style={{ transform: `translateY(${offset}px)` }}
    >
      {emoji}
    </div>
  );
}

// Animated counter with intersection observer
function AnimatedCounter({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [ref, isVisible] = useScrollReveal<HTMLSpanElement>({ threshold: 0.5 });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isVisible && !hasAnimated.current) {
      hasAnimated.current = true;
      let startTime: number;
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        // Easing function for smooth deceleration
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(eased * end));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }
  }, [isVisible, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// Section wrapper with scroll reveal
function RevealSection({
  children,
  className = "",
  animation = "up",
  delay = 0
}: {
  children: React.ReactNode;
  className?: string;
  animation?: "up" | "left" | "right" | "scale" | "blur";
  delay?: number;
}) {
  const [ref, isVisible] = useScrollReveal<HTMLElement>({ threshold: 0.1 });
  const animationClass = {
    up: "scroll-reveal-up",
    left: "scroll-reveal-left",
    right: "scroll-reveal-right",
    scale: "scroll-reveal-scale",
    blur: "scroll-reveal-blur",
  }[animation];

  return (
    <section
      ref={ref}
      className={`${animationClass} ${isVisible ? 'revealed' : ''} ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </section>
  );
}

// Feature card with scroll reveal
function FeatureCard({
  icon: Icon,
  title,
  description,
  href,
  buttonText,
  colorClass,
  emoji,
  index,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  buttonText: string;
  colorClass: string;
  emoji: string;
  index: number;
}) {
  const [ref, isVisible] = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={`scroll-reveal-up ${isVisible ? 'revealed' : ''}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <Card
        className="group relative overflow-hidden border-2 border-border bg-card shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] transition-all h-full"
      >
        {/* Color accent top bar */}
        <div className={`h-2 ${colorClass} border-b-2 border-border`} />

        <CardHeader className="space-y-4 pb-2">
          <div className="flex items-center justify-between">
            <div className={`w-14 h-14 rounded-xl ${colorClass} border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] flex items-center justify-center group-hover:animate-wiggle transition-all`}>
              <Icon className="size-7 text-foreground" />
            </div>
            <span className="text-3xl group-hover:animate-bounce transition-all">{emoji}</span>
          </div>
          <CardTitle className="text-xl font-black uppercase tracking-tight">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground font-medium">
            {description}
          </p>
          <Button
            asChild
            className="w-full font-bold uppercase border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <Link href={href} className="flex items-center justify-center gap-2">
              {buttonText}
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Pricing card with scroll reveal
function PricingCard({
  title,
  price,
  period,
  description,
  features,
  buttonText,
  href,
  badge,
  featured,
  index,
}: {
  title: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  buttonText: string;
  href: string;
  badge?: string;
  featured?: boolean;
  index: number;
}) {
  const [ref, isVisible] = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={`scroll-reveal-scale ${isVisible ? 'revealed' : ''}`}
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      <Card
        className={`relative overflow-hidden border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] transition-all h-full ${featured ? 'ring-4 ring-primary' : ''}`}
      >
        {featured && (
          <div className="absolute -top-1 -right-1 z-10">
            <div className="bg-primary text-primary-foreground px-4 py-1 text-xs font-black uppercase border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] rotate-3">
              Most Popular
            </div>
          </div>
        )}

        <CardHeader className={`${featured ? 'bg-primary/10' : ''} border-b-2 border-border`}>
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-xl font-black uppercase">{title}</CardTitle>
            {badge && !featured && (
              <Badge className="border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] font-bold uppercase">
                {badge}
              </Badge>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-black">{price}</span>
            {period && <span className="text-muted-foreground font-bold">/{period}</span>}
          </div>
          <p className="text-sm text-muted-foreground font-medium mt-2">{description}</p>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <ul className="space-y-3">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-sm font-medium">
                <CheckCircle className="size-5 text-accent shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
          <Button
            asChild
            variant={featured ? "default" : "outline"}
            className="w-full font-bold uppercase border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <Link href={href}>{buttonText}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Step card for "How It Works" section
function StepCard({
  step,
  title,
  desc,
  emoji,
  color,
  index,
  showArrow,
}: {
  step: string;
  title: string;
  desc: string;
  emoji: string;
  color: string;
  index: number;
  showArrow?: boolean;
}) {
  const [ref, isVisible] = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });

  return (
    <div
      ref={ref}
      className={`relative scroll-reveal-up ${isVisible ? 'revealed' : ''}`}
      style={{ animationDelay: `${index * 0.2}s` }}
    >
      <Card className="border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] transition-all h-full">
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          <div className={`w-16 h-16 ${color} rounded-2xl border-2 border-border shadow-[3px_3px_0px_0px_var(--shadow-color)] mx-auto flex items-center justify-center`}>
            <span className="text-3xl font-black">{step}</span>
          </div>
          <div className="text-4xl">{emoji}</div>
          <h3 className="text-xl font-black uppercase">{title}</h3>
          <p className="text-muted-foreground font-medium">{desc}</p>
        </CardContent>
      </Card>
      {showArrow && (
        <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
          <ArrowRight className="size-8 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

// Stats card with hover effect
function StatCard({ icon: Icon, value, label, color }: { icon: React.ElementType; value: React.ReactNode; label: string; color: string }) {
  return (
    <div className={`${color} border-2 border-border rounded-xl p-4 shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_var(--shadow-color)] transition-all`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-background/50 rounded-lg border-2 border-border">
          <Icon className="size-5" />
        </div>
        <div>
          <div className="text-2xl font-black">{value}</div>
          <div className="text-xs font-bold uppercase opacity-80">{label}</div>
        </div>
      </div>
    </div>
  );
}

// Scroll indicator
function ScrollIndicator() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY < 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <span className="text-xs font-bold uppercase tracking-widest">Scroll</span>
        <ChevronDown className="size-6" />
      </div>
    </div>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative overflow-hidden">
      <ScrollProgressBar />
      <FloatingShapes />

      <div className="relative z-10 space-y-24 pb-20">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 py-16">
          {/* Floating emojis background */}
          <FloatingEmoji emoji="🏠" className="top-10 left-[5%] opacity-20" speed={0.05} />
          <FloatingEmoji emoji="⭐" className="top-20 right-[10%] opacity-20" speed={0.08} />
          <FloatingEmoji emoji="🎯" className="bottom-32 left-[15%] opacity-20" speed={0.12} />
          <FloatingEmoji emoji="🏆" className="bottom-20 right-[5%] opacity-20" speed={0.06} />
          <FloatingEmoji emoji="✨" className="top-1/3 left-[8%] opacity-15 text-3xl" speed={0.1} />
          <FloatingEmoji emoji="💪" className="top-1/2 right-[12%] opacity-15 text-3xl" speed={0.07} />

          {/* Decorative corners */}
          <div className="absolute top-8 left-8 w-20 h-20 border-t-4 border-l-4 border-border rounded-tl-3xl hidden md:block" />
          <div className="absolute top-8 right-8 w-20 h-20 border-t-4 border-r-4 border-border rounded-tr-3xl hidden md:block" />
          <div className="absolute bottom-20 left-8 w-20 h-20 border-b-4 border-l-4 border-border rounded-bl-3xl hidden md:block" />
          <div className="absolute bottom-20 right-8 w-20 h-20 border-b-4 border-r-4 border-border rounded-br-3xl hidden md:block" />

          <div className="relative z-10 max-w-5xl mx-auto space-y-8">
            {/* Badge */}
            <div
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-full bg-secondary text-secondary-foreground border-2 border-border shadow-[3px_3px_0px_0px_var(--shadow-color)] font-bold uppercase text-sm transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
            >
              <Sparkles className="size-4 animate-sparkle" />
              Family Life, Gamified
              <PartyPopper className="size-4" />
            </div>

            {/* Main headline */}
            <div className="space-y-4 overflow-hidden">
              <h1
                className={`text-5xl sm:text-6xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.9] transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
              >
                <span className="block">Where Chores</span>
                <span className="inline-block bg-primary text-primary-foreground px-4 py-2 border-2 border-border shadow-[6px_6px_0px_0px_var(--shadow-color)] rotate-[-1deg] my-2 hover:rotate-0 hover:shadow-[8px_8px_0px_0px_var(--shadow-color)] transition-all cursor-default">
                  Become Quests
                </span>
              </h1>

              <p
                className={`text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-bold leading-relaxed transition-all duration-1000 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              >
                Turn household chaos into family adventures with shared calendars, point systems, and rewards everyone loves.
                <span className="text-primary"> Keep your family in the loop.</span>
              </p>
            </div>

            {/* CTA Buttons */}
            <div
              className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            >
              <Button
                asChild
                size="lg"
                className="relative text-lg px-8 py-7 h-auto font-black uppercase border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all group"
              >
                <Link href="/auth/signup" className="flex items-center gap-3">
                  <Rocket className="size-6 group-hover:animate-bounce" />
                  Start Your Quest
                  <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-lg px-8 py-7 h-auto font-bold uppercase border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] hover:bg-secondary hover:text-secondary-foreground transition-all"
              >
                <Link href="/auth/login" className="flex items-center gap-2">
                  <Users className="size-5" />
                  Sign In
                </Link>
              </Button>
            </div>

            {/* Social proof */}
            <div
              className={`pt-8 transition-all duration-1000 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            >
              <div className="flex flex-wrap justify-center gap-4">
                <StatCard icon={Users} value={<AnimatedCounter end={2500} suffix="+" />} label="Happy Families" color="bg-[var(--event-purple)]/20" />
                <StatCard icon={CheckCircle} value={<AnimatedCounter end={50000} suffix="+" />} label="Chores Done" color="bg-[var(--event-green)]/20" />
                <StatCard icon={Trophy} value={<AnimatedCounter end={100000} suffix="+" />} label="Points Earned" color="bg-[var(--event-orange)]/20" />
              </div>
            </div>
          </div>

          <ScrollIndicator />
        </section>

        {/* Marquee Section */}
        <section className="py-6 bg-primary text-primary-foreground border-y-2 border-border overflow-hidden">
          <div className="animate-marquee whitespace-nowrap flex gap-8 items-center">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-8 items-center">
                <span className="text-2xl font-black uppercase flex items-center gap-2">
                  <Star className="size-6" /> Calendar Sharing
                </span>
                <span className="text-4xl">•</span>
                <span className="text-2xl font-black uppercase flex items-center gap-2">
                  <Target className="size-6" /> Chore Tracking
                </span>
                <span className="text-4xl">•</span>
                <span className="text-2xl font-black uppercase flex items-center gap-2">
                  <Trophy className="size-6" /> Points & Rewards
                </span>
                <span className="text-4xl">•</span>
                <span className="text-2xl font-black uppercase flex items-center gap-2">
                  <Crown className="size-6" /> Leaderboards
                </span>
                <span className="text-4xl">•</span>
                <span className="text-2xl font-black uppercase flex items-center gap-2">
                  <Zap className="size-6" /> Real-time Sync
                </span>
                <span className="text-4xl">•</span>
              </div>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <RevealSection className="space-y-12 px-4" animation="up">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <Badge className="px-4 py-2 text-sm font-black uppercase border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)]">
              <Sparkles className="size-4 mr-2" />
              Feature-Packed
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
              Everything Your Family Needs
            </h2>
            <p className="text-lg text-muted-foreground font-bold max-w-xl mx-auto">
              Powerful tools designed to bring families closer and make household management actually fun.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            <FeatureCard
              icon={CalendarDays}
              title="Weekly Dashboard"
              description="View family events, track progress, and stay organized with beautiful calendar views."
              href="/dashboard"
              buttonText="Open Dashboard"
              colorClass="bg-[var(--event-purple)]"
              emoji="📅"
              index={0}
            />
            <FeatureCard
              icon={CheckCircle}
              title="Chore Quest"
              description="Gamified chore management with points, streaks, and satisfying completion animations."
              href="/chores"
              buttonText="Start Quest"
              colorClass="bg-[var(--event-orange)]"
              emoji="✨"
              index={1}
            />
            <FeatureCard
              icon={Trophy}
              title="Leaderboard"
              description="Friendly competition with weekly rankings, badges, and bragging rights for top performers."
              href="/leaderboard"
              buttonText="See Rankings"
              colorClass="bg-[var(--event-green)]"
              emoji="🏆"
              index={2}
            />
            <FeatureCard
              icon={Users}
              title="Family Hub"
              description="Manage profiles, roles, and permissions. Parents and kids each get their own experience."
              href="/settings"
              buttonText="Manage Family"
              colorClass="bg-[var(--event-blue)]"
              emoji="👨‍👩‍👧‍👦"
              index={3}
            />
            <FeatureCard
              icon={Gift}
              title="Rewards System"
              description="Set goals, redeem points for prizes, and celebrate achievements as a family."
              href="/dashboard"
              buttonText="Set Goals"
              colorClass="bg-primary"
              emoji="🎁"
              index={4}
            />
            <FeatureCard
              icon={Shield}
              title="Parent Controls"
              description="Secure PIN protection, approval workflows, and full visibility into family activities."
              href="/settings"
              buttonText="Admin Panel"
              colorClass="bg-secondary"
              emoji="🔐"
              index={5}
            />
          </div>
        </RevealSection>

        {/* How It Works */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto space-y-12">
            <RevealSection animation="blur" className="text-center space-y-4">
              <Badge className="px-4 py-2 text-sm font-black uppercase border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] bg-accent text-accent-foreground">
                <Clock className="size-4 mr-2" />
                Quick Setup
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
                Up & Running in 3 Steps
              </h2>
            </RevealSection>

            <div className="grid md:grid-cols-3 gap-8">
              <StepCard
                step="1"
                title="Create Family"
                desc="Sign up and create your family unit with a secure parent PIN."
                emoji="🏠"
                color="bg-[var(--event-purple)]"
                index={0}
                showArrow
              />
              <StepCard
                step="2"
                title="Add Members"
                desc="Invite parents, add kids, and customize everyone's profile."
                emoji="👥"
                color="bg-[var(--event-blue)]"
                index={1}
                showArrow
              />
              <StepCard
                step="3"
                title="Start Earning"
                desc="Create chores, complete tasks, and watch the points roll in!"
                emoji="🚀"
                color="bg-[var(--event-green)]"
                index={2}
              />
            </div>
          </div>
        </section>

        {/* Testimonial / Social Proof */}
        <RevealSection className="px-4" animation="scale">
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-border shadow-[6px_6px_0px_0px_var(--shadow-color)] overflow-hidden">
              <CardContent className="p-8 md:p-12 text-center space-y-6">
                <div className="flex justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-8 fill-secondary text-secondary" />
                  ))}
                </div>
                <blockquote className="text-2xl md:text-3xl font-black leading-relaxed">
                  "FamLoop turned our chaotic mornings into a <span className="bg-secondary/30 px-2">fun family game</span>. The kids actually <span className="bg-accent/30 px-2">fight over chores</span> now!"
                </blockquote>
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-full border-2 border-border flex items-center justify-center text-xl">
                    👩
                  </div>
                  <div className="text-left">
                    <div className="font-black">Sarah M.</div>
                    <div className="text-sm text-muted-foreground font-medium">Mom of 3 • Using FamLoop for 6 months</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </RevealSection>

        {/* Pricing Section */}
        <RevealSection className="space-y-12 px-4" animation="up">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <Badge className="px-4 py-2 text-sm font-black uppercase border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] bg-secondary text-secondary-foreground">
              <TrendingUp className="size-4 mr-2" />
              Simple Pricing
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
              Plans for Every Family
            </h2>
            <p className="text-lg text-muted-foreground font-bold">
              Start free, upgrade when you need more. No hidden fees, cancel anytime.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            <PricingCard
              title="Free"
              price="$0"
              description="Perfect for getting started"
              features={[
                "1 family, up to 2 kids",
                "Basic calendar & chores",
                "Points tracking",
                "Weekly leaderboard",
              ]}
              buttonText="Get Started Free"
              href="/auth/signup"
              badge="Start Here"
              index={0}
            />
            <PricingCard
              title="Family Plus"
              price="$10"
              period="mo"
              description="For growing families"
              features={[
                "Up to 6 kids",
                "Recurring chores",
                "Calendar sharing & export",
                "Advanced rewards",
                "Detailed reports",
              ]}
              buttonText="Upgrade to Plus"
              href="/auth/signup"
              featured
              index={1}
            />
            <PricingCard
              title="Family Pro"
              price="$18"
              period="mo"
              description="The complete experience"
              features={[
                "Unlimited kids",
                "All Plus features",
                "Google Calendar sync",
                "ICS export",
                "Priority support",
              ]}
              buttonText="Go Pro"
              href="/auth/signup"
              badge="Best Value"
              index={2}
            />
          </div>
        </RevealSection>

        {/* Final CTA */}
        <RevealSection className="relative mx-4" animation="scale">
          <Card className="max-w-4xl mx-auto border-4 border-border shadow-[8px_8px_0px_0px_var(--shadow-color)] overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute top-10 left-10 text-8xl animate-float-slow">🎉</div>
              <div className="absolute bottom-10 right-10 text-8xl animate-float-medium">✨</div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl animate-pulse">❤️</div>
            </div>

            <CardContent className="relative z-10 py-16 px-8 text-center space-y-8">
              <div className="inline-block animate-bounce">
                <span className="text-6xl">🚀</span>
              </div>

              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
                  Ready to Start
                  <span className="block bg-accent text-accent-foreground px-4 py-2 border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow-color)] inline-block rotate-1 mt-2 hover:rotate-0 transition-transform cursor-default">
                    Your Quest?
                  </span>
                </h2>
                <p className="text-xl text-muted-foreground font-bold max-w-xl mx-auto">
                  Join thousands of families who turned chores into adventures and responsibilities into rewards.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="text-xl px-10 py-8 h-auto font-black uppercase border-2 border-border shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all group"
                >
                  <Link href="/auth/signup" className="flex items-center gap-3">
                    <Heart className="size-6 group-hover:animate-pulse" />
                    Begin Your Quest
                    <ArrowRight className="size-6 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </Button>
              </div>

              <p className="text-sm text-muted-foreground font-medium">
                No credit card required • Free forever plan available • Setup in under 5 minutes
              </p>
            </CardContent>
          </Card>
        </RevealSection>

        {/* Footer */}
        <footer className="border-t-2 border-border bg-muted/30 mt-20">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="grid gap-8 md:grid-cols-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black uppercase tracking-tighter">FAMLOOP</span>
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  Where chores become quests and families become teams.
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="font-black uppercase">Product</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/auth/signup" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Get Started</Link></li>
                  <li><Link href="/auth/login" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Sign In</Link></li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-black uppercase">Legal</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/legal/privacy" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Privacy Policy</Link></li>
                  <li><Link href="/legal/terms" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Terms of Service</Link></li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-black uppercase">Connect</h4>
                <div className="flex gap-2">
                  <div className="w-10 h-10 bg-muted rounded-lg border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] flex items-center justify-center hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_var(--shadow-color)] transition-all cursor-pointer">
                    <span className="text-lg">𝕏</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t-2 border-border mt-8 pt-8 text-center text-sm text-muted-foreground font-medium">
              <p>© {new Date().getFullYear()} FamLoop. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
