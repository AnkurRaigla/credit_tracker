import React from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { 
  GraduationCap, 
  ArrowRight, 
  Shield, 
  BarChart3, 
  Award, 
  Layers 
} from "lucide-react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default async function IndexPage() {
  // If user is already authenticated, redirect straight to workspace
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  const features = [
    {
      title: "Automated Credit Calculator",
      description: "Reads uploaded result sheets and calculates earned credits across 7 structural categories, ignoring fails in totals.",
      icon: Layers,
    },
    {
      title: "Active Backlog Analysis",
      description: "Isolates active fails from historical backlogs. Recognizes when a previously failed course has been cleared.",
      icon: BarChart3,
    },
    {
      title: "Advisory Risk Flags",
      description: "Applies statistical risk modeling to automatically tag students at academic risk due to credit shortage or low CGPAs.",
      icon: Shield,
    },
    {
      title: "Gemini AI Advisor",
      description: "Generates custom academic counseling reports, recommending elective selections and remedial backlog clearance paths.",
      icon: Award,
    },
  ];

  return (
    <main className="min-h-screen w-full relative bg-background text-foreground flex flex-col justify-between overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-[-20%] left-[-20%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[150px] pulse-glow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-500/5 blur-[150px] pulse-glow" style={{ animationDelay: "2.5s" }}></div>

      {/* Navigation Header */}
      <header className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center shadow shadow-primary/20">
            <GraduationCap className="w-5.5 h-5.5 text-primary-foreground" />
          </div>
          <span className="font-extrabold text-lg tracking-tight gradient-text">
            B.Tech tracker
          </span>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-xs transition-colors shadow shadow-primary/15"
          >
            Staff Portal
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-5xl mx-auto px-6 py-12 md:py-20 text-center space-y-8 z-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider animate-pulse">
            <Shield className="w-3.5 h-3.5" /> SECURE STAFF WORKSPACE
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight max-w-3xl mx-auto">
            B.Tech Academic Credit Tracking & Backlog Auditor
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Monitor, audit, and analyze whether students have successfully completed their required 185 credits across curriculum structures. Auto-flag failures, cleared backlogs, and academic risk.
          </p>
        </div>

        <div className="flex justify-center pt-2">
          <Link
            href="/login"
            className="group px-6 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/95 hover:to-purple-600/95 active:scale-[0.98] text-primary-foreground font-semibold text-sm flex items-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/30 transition-all duration-200"
          >
            <span>Enter Coordinator Workspace</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="w-full max-w-7xl mx-auto px-6 py-12 z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feat, i) => {
          const Icon = feat.icon;
          return (
            <div key={i} className="glass-card p-6 rounded-3xl border border-border flex flex-col justify-between min-h-60">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-2 mt-auto">
                <h3 className="font-bold text-sm text-foreground">{feat.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feat.description}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 border-t border-border/60 text-center text-xs text-muted-foreground z-10">
        &copy; {new Date().getFullYear()} B.Tech Credit audits. Engineered for Academic Coordinators & Class Advisors.
      </footer>
    </main>
  );
}
