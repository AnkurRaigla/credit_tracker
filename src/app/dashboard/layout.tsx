import React from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/authActions";
import ThemeToggle from "@/components/ThemeToggle";
import { 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  UploadCloud, 
  LogOut, 
  UserCheck 
} from "lucide-react";
import Link from "next/link";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Server-side authentication shield
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const navLinks = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/students", label: "Student Records", icon: Users },
    { href: "/dashboard/subjects", label: "Curriculum Master", icon: BookOpen },
    { href: "/dashboard/upload", label: "Bulk Data Ingest", icon: UploadCloud },
  ];

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-300">
      {/* Sidebar Navigation */}
      <aside className="w-72 border-r border-border bg-card/60 backdrop-blur-xl shrink-0 hidden md:flex flex-col justify-between p-6 sticky top-0 h-screen">
        <div className="space-y-8">
          {/* Logo Branding */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center shadow-md shadow-primary/10">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-lg gradient-text block leading-none">
                B.Tech Audits
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1 block">
                Credit Tracker
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground font-medium text-sm transition-all duration-200"
                >
                  <Icon className="w-4 h-4 text-primary/70" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="space-y-4 pt-6 border-t border-border">
          {/* User Badge */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-primary" />
            </div>
            <div className="overflow-hidden">
              <span className="font-semibold text-sm block truncate leading-tight">
                {session.name}
              </span>
              <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20">
                {session.role}
              </span>
            </div>
          </div>

          {/* Logout Action */}
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/5 hover:bg-destructive/10 text-destructive font-medium text-sm transition-colors duration-200 border border-destructive/10"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 border-b border-border bg-card/45 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-30">
          <h2 className="font-bold text-xl tracking-tight">Academic Control Center</h2>
          
          <div className="flex items-center gap-4">
            {/* Quick Profile Tag (Mobile Only) */}
            <div className="md:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{session.name.split(" ")[0]}</span>
            </div>

            {/* Theme Toggle Button */}
            <ThemeToggle />
          </div>
        </header>

        {/* Dynamic Nested Child Route View */}
        <main className="flex-1 p-8 overflow-y-auto bg-background/30">
          <div className="max-w-7xl mx-auto animate-fade-in space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
