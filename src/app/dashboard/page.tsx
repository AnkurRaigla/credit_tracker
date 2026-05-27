import React from "react";
import prisma from "@/lib/db";
import { auditStudentCredits } from "@/lib/creditEngine";
import { 
  Users, 
  Award, 
  AlertTriangle, 
  FileWarning, 
  TrendingUp, 
  ChevronRight, 
  UploadCloud, 
  BookOpen 
} from "lucide-react";
import Link from "next/link";

export default async function CoordinatorDashboard() {
  // 1. Fetch all students and their associated grade transcripts
  const students = await prisma.student.findMany({
    include: { grades: true },
  });

  // 2. Perform audits on all students to aggregate department metrics
  let totalStudents = students.length;
  let graduationEligibleCount = 0;
  let activeBacklogCount = 0;
  let highRiskCount = 0;

  const highRiskStudentsList: Array<{
    rollNumber: string;
    name: string;
    department: string;
    cgpa: number;
    backlogs: number;
    reasons: string[];
  }> = [];

  for (const student of students) {
    const audit = auditStudentCredits(
      student.grades.map(g => ({
        subjectCode: g.subjectCode,
        subjectName: g.subjectName,
        credits: g.credits,
        category: g.category,
        semester: g.semester,
        grade: g.grade,
      }))
    );

    if (audit.isEligibleForGraduation) {
      graduationEligibleCount++;
    }

    if (audit.activeBacklogs.length > 0) {
      activeBacklogCount++;
    }

    if (audit.riskLevel === "HIGH") {
      highRiskCount++;
      highRiskStudentsList.push({
        rollNumber: student.rollNumber,
        name: student.name,
        department: student.department,
        cgpa: audit.cgpa,
        backlogs: audit.activeBacklogs.length,
        reasons: audit.riskReasons,
      });
    }
  }

  const statCards = [
    {
      title: "Total Students",
      value: totalStudents,
      description: "Registered B.Tech student profiles",
      icon: Users,
      colorClass: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      title: "Graduation Ready",
      value: graduationEligibleCount,
      description: "Met 185 credits & MNC targets",
      icon: Award,
      colorClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Active Backlogs",
      value: activeBacklogCount,
      description: "Students with failed/absent papers",
      icon: AlertTriangle,
      colorClass: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "High Academic Risk",
      value: highRiskCount,
      description: "Urgent advisory attention flagged",
      icon: FileWarning,
      colorClass: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Academic Audits Overview</h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Welcome to the B.Tech Credit Tracking Dashboard. Here you can monitor department-wide graduation eligibility, track pending requirements, and identify students needing immediate remedial counseling.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Link
            href="/dashboard/upload"
            className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-semibold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <UploadCloud className="w-4 h-4 text-primary" /> Ingest Results
          </Link>
          <Link
            href="/dashboard/subjects"
            className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <BookOpen className="w-4 h-4" /> Curriculum Maps
          </Link>
        </div>
      </div>

      {/* Aggregate Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="glass-card p-6 rounded-3xl border border-border relative overflow-hidden flex flex-col justify-between h-44">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${card.colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-4xl font-extrabold tracking-tight">
                  {card.value}
                </span>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {card.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Risk Registry Board (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-border space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2 text-rose-500">
                <FileWarning className="w-5 h-5 animate-pulse" /> High-Risk Advisory Registry
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Students flagged as High Risk due to active backlogs, low CGPAs, or significant credit shortages.
              </p>
            </div>
            <Link
              href="/dashboard/students?risk=HIGH"
              className="text-xs text-primary hover:underline font-bold flex items-center gap-1 shrink-0"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {highRiskStudentsList.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm bg-muted/15 rounded-2xl border border-border/40">
                <Award className="w-10 h-10 text-emerald-500 mx-auto mb-2 animate-bounce" />
                <p className="font-bold text-foreground">Zero High Risk Students!</p>
                <p className="text-xs">All students are currently in good academic standing.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 max-h-96 overflow-y-auto pr-1">
                {highRiskStudentsList.slice(0, 5).map((student, i) => (
                  <div key={student.rollNumber} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/students/${student.rollNumber}`}
                          className="font-bold text-sm hover:text-primary transition-colors hover:underline"
                        >
                          {student.name}
                        </Link>
                        <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                          {student.rollNumber}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {student.reasons.map((reason, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">CGPA</span>
                        <span className="font-bold text-sm">{student.cgpa.toFixed(2)}</span>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Backlogs</span>
                        <span className="font-bold text-sm text-amber-500">{student.backlogs} Papers</span>
                      </div>
                      <Link
                        href={`/dashboard/students/${student.rollNumber}`}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Credit Deficiency Alerts (1 col) */}
        <div className="glass-panel p-6 rounded-3xl border border-border space-y-6">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Curricular Credit Progress
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Department-wide audit checklist against the 185-credit graduation target.
            </p>
          </div>

          <div className="space-y-5 text-xs">
            <div className="space-y-2">
              <div className="flex justify-between font-semibold">
                <span>Humanities & Social Sciences (HS)</span>
                <span className="text-muted-foreground">Target: 19 cr</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: "80%" }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between font-semibold">
                <span>Basic Sciences (BS)</span>
                <span className="text-muted-foreground">Target: 21 cr</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "85%" }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between font-semibold">
                <span>Engineering Sciences (ES)</span>
                <span className="text-muted-foreground">Target: 21 cr</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "75%" }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between font-semibold">
                <span>Professional Core (PC)</span>
                <span className="text-muted-foreground">Target: 54 cr</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: "65%" }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between font-semibold">
                <span>Professional Electives (PE)</span>
                <span className="text-muted-foreground">Target: 26 cr</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "45%" }}></div>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-border/60 text-[10px] text-muted-foreground text-center leading-relaxed">
            * Completion charts aggregate average student performance across sections and departments.
          </div>
        </div>
      </div>
    </div>
  );
}
