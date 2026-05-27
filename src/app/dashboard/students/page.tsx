import React from "react";
import prisma from "@/lib/db";
import { auditStudentCredits } from "@/lib/creditEngine";
import StudentSearchGrid from "./StudentSearchGrid";

export default async function StudentListPage() {
  // Fetch all students with their full grades transcripts
  const students = await prisma.student.findMany({
    include: { grades: true },
    orderBy: { rollNumber: "asc" },
  });

  // Pre-audit every student on the server to make client-side searching and filtering instantaneous!
  const auditedStudents = students.map(student => {
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

    const categoryDeficiencies = audit.categoryReport
      .filter(r => r.shortage > 0)
      .map(r => r.category);

    return {
      rollNumber: student.rollNumber,
      name: student.name,
      section: student.section,
      department: student.department,
      semester: student.semester,
      cgpa: audit.cgpa,
      totalEarnedCredits: audit.totalEarnedCredits,
      backlogCount: audit.activeBacklogs.length,
      riskLevel: audit.riskLevel,
      isEligible: audit.isEligibleForGraduation,
      categoryDeficiencies,
      mncStatus: audit.mncStatus,
    };
  });

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Student Academic Records</h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Search and query student progress. Apply advanced filters for active backlogs, category deficiencies, or credit shortages, and export audited deficiency reports.
        </p>
      </div>

      {/* Interactive Listing Grid (Client Component) */}
      <StudentSearchGrid initialStudents={auditedStudents} />
    </div>
  );
}
