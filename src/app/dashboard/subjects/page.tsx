import React from "react";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import SubjectMasterTable from "./SubjectMasterTable";

export default async function SubjectMasterPage() {
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";

  // Fetch all curriculum subjects mapped in SubjectMaster, sorted by code
  const subjects = await prisma.subjectMaster.findMany({
    orderBy: { code: "asc" },
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Curriculum Master mapping</h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Maintain the official subject-credit-category master table. Changes to credit counts or category mappings dynamically trigger a full recalculation of affected student transcripts in real time.
        </p>
      </div>

      {/* Interactive CRUD Table Component */}
      <SubjectMasterTable 
        initialSubjects={subjects.map(s => ({
          code: s.code,
          name: s.name,
          credits: s.credits,
          category: s.category,
        }))} 
        isAdmin={isAdmin} 
      />
    </div>
  );
}
