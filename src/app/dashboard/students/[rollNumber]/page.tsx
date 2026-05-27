import React from "react";
import prisma from "@/lib/db";
import { auditStudentCredits, FAILING_GRADES } from "@/lib/creditEngine";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  User, 
  Award, 
  AlertTriangle, 
  CheckCircle, 
  BookOpen, 
  Calendar,
  Layers,
  Activity,
  FileText
} from "lucide-react";
import AiAdvisorWidget from "./AiAdvisorWidget";

interface StudentDetailPageProps {
  params: Promise<{ rollNumber: string }>;
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  // Await params as required in Next.js 15 App Router
  const { rollNumber } = await params;
  const decodedRollNumber = decodeURIComponent(rollNumber).trim().toUpperCase();

  // 1. Fetch student details with all grade transcripts
  const student = await prisma.student.findUnique({
    where: { rollNumber: decodedRollNumber },
    include: { 
      grades: {
        orderBy: { semester: "asc" }
      } 
    },
  });

  if (!student) {
    redirect("/dashboard/students");
  }

  // 2. Compute academic credit audit
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

  // Group grades by semester for structured timeline rendering
  const semesterTranscripts: Record<number, typeof student.grades> = {};
  for (const grade of student.grades) {
    if (!semesterTranscripts[grade.semester]) {
      semesterTranscripts[grade.semester] = [];
    }
    semesterTranscripts[grade.semester].push(grade);
  }

  // Mandatory non-credit checklist courses (synonyms or exact codes)
  const mncChecklist = [
    { code: "MNC01", name: "Environmental Sciences" },
    { code: "MNC02", name: "Constitution of India" },
    { code: "MNC03", name: "Essence of Indian Traditional Knowledge" },
    { code: "MNC04", name: "Intellectual Property Rights" },
  ];

  return (
    <div className="space-y-8">
      {/* Back button link */}
      <div>
        <Link
          href="/dashboard/students"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Student Listing</span>
        </Link>
      </div>

      {/* 1. Student Master Header Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-border relative overflow-hidden space-y-6">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary to-purple-500"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <User className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-extrabold tracking-tight">{student.name}</h1>
                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground border border-border">
                  {student.rollNumber}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                B.Tech {student.department} — Section {student.section} &bull; Semester {student.semester}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end border-t border-border sm:border-t-0 pt-4 sm:pt-0">
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">CGPA Cumulative</span>
              <span className="text-2xl font-extrabold tracking-tight">{audit.cgpa.toFixed(2)}</span>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Earned Credits</span>
              <span className={`text-2xl font-extrabold tracking-tight ${
                audit.totalEarnedCredits >= 185 ? "text-emerald-500" : "text-amber-500"
              }`}>{audit.totalEarnedCredits} / 185</span>
            </div>
          </div>
        </div>

        {/* Global Progress Bar to 185 Credits */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex justify-between text-xs font-semibold">
            <span>Overall B.Tech Graduation Progress</span>
            <span>{audit.overallProgressPercentage}% Complete</span>
          </div>
          <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${audit.overallProgressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 2. Category Audit Report Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" /> Curricular Category Compliance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {audit.categoryReport.map((record, i) => {
            const hasShortage = record.shortage > 0;
            const progress = Math.min(100, Math.round((record.earned / record.required) * 100));

            return (
              <div key={i} className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between h-36">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-sm block">{record.category}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block leading-tight">
                      Required: {record.required} cr
                    </span>
                  </div>
                  {hasShortage ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                      -{record.shortage} cr
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Passed
                    </span>
                  )}
                </div>
                
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                    <span>Earned: {record.earned} cr</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${hasShortage ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Backlog Logs & MNC Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Backlogs Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-border space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b border-border pb-3">
              <Activity className="w-5 h-5 text-primary" /> Active & Cleared Backlogs
            </h2>
            
            <div className="space-y-4">
              {/* Active Backlogs */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Active Backlogs ({audit.activeBacklogs.length})
                </span>
                {audit.activeBacklogs.length === 0 ? (
                  <p className="text-xs text-emerald-500 font-semibold bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Student has no active backlogs. All courses are successfully cleared.
                  </p>
                ) : (
                  <div className="border border-border rounded-xl overflow-hidden bg-card/45 divide-y divide-border/60">
                    {audit.activeBacklogs.map((b, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between text-xs gap-3">
                        <div>
                          <span className="font-bold font-mono bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded mr-2">
                            {b.subjectCode}
                          </span>
                          <span className="font-semibold">{b.subjectName}</span>
                        </div>
                        <span className="text-rose-500 font-bold shrink-0">
                          Grade {b.grade} (Sem {b.semesterFailed})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cleared Backlogs */}
              {audit.clearedBacklogs.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Cleared Backlogs history ({audit.clearedBacklogs.length})
                  </span>
                  <div className="border border-border rounded-xl overflow-hidden bg-card/45 divide-y divide-border/60">
                    {audit.clearedBacklogs.map((b, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between text-xs gap-3 opacity-75">
                        <div>
                          <span className="font-bold font-mono bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded mr-2">
                            {b.subjectCode}
                          </span>
                          <span className="font-semibold text-muted-foreground line-through">{b.subjectName}</span>
                        </div>
                        <span className="text-emerald-500 font-bold shrink-0 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Cleared
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MNC Tracker Column (1 col) */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-border space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b border-border pb-3">
              <Award className="w-5 h-5 text-primary" /> MNC Tracker
            </h2>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">MNC Audit Status</span>
              <span className={`px-2 py-0.5 rounded text-xs font-extrabold tracking-wider uppercase ${
                audit.mncStatus === "COMPLETED" 
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                  : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
              }`}>
                {audit.mncStatus}
              </span>
            </div>

            {/* MNC course list */}
            <div className="space-y-2.5 pt-2">
              {mncChecklist.map(mnc => {
                // Find if student passed this specific MNC
                const matchedGrade = student.grades.find(g => g.subjectCode.toUpperCase() === mnc.code);
                const isPassed = matchedGrade && (matchedGrade.grade.toUpperCase() === "S" || matchedGrade.grade.toUpperCase() === "P" || matchedGrade.earned > 0 || !FAILING_GRADES.includes(matchedGrade.grade.toUpperCase()));

                return (
                  <div key={mnc.code} className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card/30 text-xs">
                    <div className="overflow-hidden mr-2">
                      <span className="font-bold font-mono block leading-none mb-1 text-muted-foreground">{mnc.code}</span>
                      <span className="font-semibold truncate block max-w-[180px]">{mnc.name}</span>
                    </div>
                    {isPassed ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-0.5 shrink-0">
                        <CheckCircle className="w-3.5 h-3.5" /> Passed
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60 font-semibold shrink-0">
                        Pending
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Collapsible Term-wise Academic History */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" /> Term-wise Grade Transcripts
        </h2>
        
        <div className="space-y-4">
          {Object.keys(semesterTranscripts).length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm bg-card border border-border rounded-2xl">
              <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="font-bold">No academic transcripts uploaded.</p>
              <p className="text-xs">Upload semester-wise grade sheets to display transcripts.</p>
            </div>
          ) : (
            Object.keys(semesterTranscripts)
              .map(semStr => parseInt(semStr, 10))
              .sort((a, b) => a - b)
              .map(sem => {
                const semGrades = semesterTranscripts[sem];

                return (
                  <div key={sem} className="glass-panel rounded-3xl border border-border overflow-hidden bg-card/25">
                    <div className="p-4 px-6 border-b border-border bg-muted/20 font-bold text-sm flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" /> Semester {sem} Academic record
                      </span>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {semGrades.length} Papers Registered
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="border-b border-border/60 bg-muted/10 font-bold uppercase tracking-wider text-muted-foreground">
                            <th className="py-3 px-6 w-32">Subject Code</th>
                            <th className="py-3 px-6">Subject Title</th>
                            <th className="py-3 px-6 w-24">Category</th>
                            <th className="py-3 px-6 w-24 text-center">Credits</th>
                            <th className="py-3 px-6 w-24 text-center">Grade Letter</th>
                            <th className="py-3 px-6 w-24 text-center">Earned</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {semGrades.map(grade => {
                            const isFailed = grade.earned === 0 && (FAILING_GRADES.includes(grade.grade.toUpperCase()) || grade.grade.toUpperCase() === "F");
                            
                            return (
                              <tr key={grade.id} className="hover:bg-muted/10 transition-colors">
                                <td className="py-3 px-6 font-mono font-bold">{grade.subjectCode}</td>
                                <td className="py-3 px-6 font-semibold">{grade.subjectName}</td>
                                <td className="py-3 px-6">
                                  <span className="px-2 py-0.5 rounded bg-muted text-[10px] font-bold">
                                    {grade.category}
                                  </span>
                                </td>
                                <td className="py-3 px-6 text-center font-mono">{grade.credits}</td>
                                <td className="py-3 px-6 text-center font-mono">
                                  <span className={`font-bold ${
                                    isFailed ? "text-rose-500" : "text-foreground"
                                  }`}>
                                    {grade.grade}
                                  </span>
                                </td>
                                <td className="py-3 px-6 text-center font-mono font-bold">
                                  {grade.earned > 0 ? (
                                    <span className="text-emerald-500">{grade.earned} cr</span>
                                  ) : (
                                    <span className="text-rose-500">0.0 cr</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* 4. Interactive Gemini AI Advisor Component */}
      <AiAdvisorWidget rollNumber={student.rollNumber} />
    </div>
  );
}
