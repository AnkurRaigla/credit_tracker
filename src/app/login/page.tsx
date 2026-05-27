"use client";

import React, { useTransition, useState } from "react";
import { loginAction } from "@/app/actions/authActions";
import { GraduationCap, Shield, User, Lock, ArrowRight, AlertCircle, Info, RefreshCw } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await loginAction(null, formData);
      if (response && response.error) {
        setFormError(response.error);
      }
    });
  };

  return (
    <main className="min-h-screen w-full relative flex items-center justify-center p-4 overflow-hidden bg-background">
      {/* Dynamic Animated background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/10 blur-[120px] pulse-glow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-purple-500/5 blur-[120px] pulse-glow" style={{ animationDelay: "2s" }}></div>

      {/* Floating Theme Switcher */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[460px] relative z-10">
        {/* Header Branding */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/20 mb-4 animate-pulse-glow">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight gradient-text">
            B.Tech Credit Audits
          </h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-xs">
            Academic portal for tracking B.Tech credit audits, graduation eligibility, and backlogs.
          </p>
        </div>

        {/* Login Panel */}
        <div className="glass-panel p-8 rounded-3xl relative overflow-hidden border border-border">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary to-purple-500"></div>

          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Coordinator Login
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message Box */}
            {formError && (
              <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3 animate-pulse-glow">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Authentication Error</span>
                  <p className="mt-1 opacity-90">{formError}</p>
                </div>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Official Email Address
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="name@university.edu"
                  disabled={isPending}
                  className="w-full bg-background/50 hover:bg-background/80 focus:bg-background border border-border focus:border-primary/50 rounded-2xl py-3.5 pl-11 pr-4 text-sm outline-none transition-all duration-200 focus:ring-4 focus:ring-primary/10"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Password Key
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  placeholder="••••••••••••"
                  disabled={isPending}
                  className="w-full bg-background/50 hover:bg-background/80 focus:bg-background border border-border focus:border-primary/50 rounded-2xl py-3.5 pl-11 pr-4 text-sm outline-none transition-all duration-200 focus:ring-4 focus:ring-primary/10"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-6 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/95 hover:to-purple-600/95 active:scale-[0.98] text-primary-foreground font-semibold py-3.5 px-4 rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/30 flex items-center justify-center gap-2 group transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isPending ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Demo Accounts Credentials Tooltip */}
        <div className="mt-6 p-4 rounded-2xl bg-card border border-border flex gap-3 text-xs">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-muted-foreground">
            <span className="font-bold text-foreground block">Academic Staff Seed Accounts:</span>
            <div>
              <span className="font-semibold text-foreground">1. System Admin Roles:</span>
              <p>Email: <code className="bg-muted px-1.5 py-0.5 rounded text-primary">admin@btechtracker.edu</code></p>
              <p>Password: <code className="bg-muted px-1.5 py-0.5 rounded text-primary">adminpassword</code></p>
            </div>
            <div className="pt-1">
              <span className="font-semibold text-foreground">2. Class Advisor Roles:</span>
              <p>Email: <code className="bg-muted px-1.5 py-0.5 rounded text-primary">advisor@btechtracker.edu</code></p>
              <p>Password: <code className="bg-muted px-1.5 py-0.5 rounded text-primary">advisorpassword</code></p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
