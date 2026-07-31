import React from "react";
import { Link } from "react-router-dom";
import { Users, Shield, Bell, TrendingUp, ArrowRight, CheckCircle2, Smartphone, Vote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Users,
    title: "Group Savings",
    desc: "Create savings groups of Rs.10, Rs.50 or Rs.100 per round with friends, family or colleagues.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Vote,
    title: "Transparent Voting",
    desc: "Any withdrawal requires approval from all members. No one can take money without group consensus.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    desc: "Automatic contribution reminders so no one forgets their payment. Daily, weekly or monthly.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    desc: "Bank-level security with Row Level Security. Only group members can see group data.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: TrendingUp,
    title: "Track Progress",
    desc: "See pool balance, contribution history and round progress in real time.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    desc: "Designed for phones first. Works perfectly on any device, any screen size.",
    color: "bg-primary/10 text-primary",
  },
];

const steps = [
  { step: "01", title: "Create a Group", desc: "Choose Rs.10, Rs.50 or Rs.100 tier. Set frequency — daily, weekly or monthly." },
  { step: "02", title: "Invite Members", desc: "Share your unique invite code or link. Members join instantly." },
  { step: "03", title: "Save Together", desc: "Everyone contributes each round. Request withdrawals — all members vote to approve." },
];

const tiers = [
  { amount: "10", members: "Up to 20", freq: "Daily / Weekly / Monthly", color: "border-primary/30" },
  { amount: "50", members: "Up to 30", freq: "Daily / Weekly / Monthly", color: "border-primary/60", popular: true },
  { amount: "100", members: "Up to 50", freq: "Daily / Weekly / Monthly", color: "border-primary/30" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">Rs</span>
            </div>
            <span className="font-heading font-bold text-xl">
              Bachat<span className="text-primary">Group</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="rounded-xl">Log in</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="rounded-xl">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <CheckCircle2 className="w-3.5 h-3.5" />
          100% Free — No hidden charges
        </div>
        <h1 className="font-heading font-bold text-4xl md:text-6xl text-foreground leading-tight mb-6">
          Save Together,<br />
          <span className="text-primary">Trust Together</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          BachatGroup is a transparent group savings app for friends, family and colleagues.
          Contribute every round, and withdraw only when everyone agrees.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/register">
            <Button size="lg" className="rounded-xl h-13 px-8 font-semibold text-base gap-2 w-full sm:w-auto">
              Start Saving Free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline" className="rounded-xl h-13 px-8 font-semibold text-base w-full sm:w-auto">
              Log in to your account
            </Button>
          </Link>
        </div>

        {/* Social proof */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            No bank account required
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Works with UPI / cash
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Real-time updates
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-muted/40 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-3xl mb-3">How it works</h2>
            <p className="text-muted-foreground">Get your group saving in 3 simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground font-heading font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-heading font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-3xl mb-3">Everything your group needs</h2>
            <p className="text-muted-foreground">Built for transparency and trust</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <Card key={f.title} className="p-5 hover:shadow-md hover:border-primary/20 transition-all duration-300">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${f.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-bold text-base mb-1.5">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Tiers ── */}
      <section className="bg-muted/40 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-3xl mb-3">Pick your savings tier</h2>
            <p className="text-muted-foreground">Choose how much your group saves each round</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {tiers.map((t) => (
              <Card key={t.amount} className={`p-6 text-center border-2 ${t.color} ${t.popular ? "shadow-lg scale-105" : ""} transition-all hover:shadow-md`}>
                {t.popular && (
                  <div className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
                    Most Popular
                  </div>
                )}
                <div className="font-heading font-bold text-4xl text-primary mb-1">Rs.{t.amount}</div>
                <div className="text-xs text-muted-foreground mb-4">per member per round</div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    {t.members}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    {t.freq}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    Unanimous withdrawal voting
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/register">
              <Button size="lg" className="rounded-xl px-8 font-semibold gap-2">
                Create your group free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-heading font-bold text-3xl mb-4">
            Ready to start saving together?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join hundreds of groups already saving transparently with BachatGroup.
            Free forever. No credit card needed.
          </p>
          <Link to="/register">
            <Button size="lg" className="rounded-xl px-10 font-semibold text-base gap-2">
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">Rs</span>
            </div>
            <span className="font-heading font-bold text-sm">BachatGroup</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link to="/legal" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/legal" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <span>© 2026 BachatGroup</span>
          </div>
        </div>
      </footer>
    </div>
  );
}