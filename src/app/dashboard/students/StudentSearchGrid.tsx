"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Search, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  HelpCircle,
  FileSpreadsheet,
  ChevronRight,
  TrendingUp
} from "lucide-react";

interface AuditedStudent {
  rollNumber: string;
  name: string;
  section: string;
  department: string;
  semester: number;
  cgpa: number;
  totalEarnedCredits: number;
  backlogCount: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  isEligible: boolean;
  categoryDeficiencies: string[];
  mncStatus: "COMPLETED" | "PENDING";
}

interface StudentSearchGridProps {
  initialStudents: AuditedStudent[];
}

export default function StudentSearchGrid({ initialStudents }: StudentSearchGridProps) {
  // Filters States
  const [searchQuery, setSearchQuery] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [backlogFilter, setBacklogFilter] = useState("ALL");
  const [creditFilter, setCreditFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Filtering Logic
  const filteredStudents = initialStudents.filter(student => {
    // 1. Search Query mapping
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      student.rollNumber.toLowerCase().includes(query) ||
      student.name.toLowerCase().includes(query) ||
      student.department.toLowerCase().includes(query) ||
      student.section.toLowerCase().includes(query);

    // 2. Semester Filter
    const matchesSemester = semesterFilter === "ALL" || student.semester.toString() === semesterFilter;

    // 3. Risk Filter
    const matchesRisk = riskFilter === "ALL" || student.riskLevel === riskFilter;

    // 4. Backlog Filter
    const matchesBacklog = 
      backlogFilter === "ALL" || 
      (backlogFilter === "YES" && student.backlogCount > 0) ||
      (backlogFilter === "NO" && student.backlogCount === 0);

    // 5. Credit Filter
    const matchesCredit = 
      creditFilter === "ALL" ||
      (creditFilter === "DEFICIENT" && student.totalEarnedCredits < 185) ||
      (creditFilter === "COMPLETE" && student.totalEarnedCredits >= 185);

    // 6. Category Deficiency Filter
    const matchesCategory = 
      categoryFilter === "ALL" || 
      (categoryFilter === "MNC" && student.mncStatus === "PENDING") ||
      (categoryFilter !== "MNC" && student.categoryDeficiencies.includes(categoryFilter));

    return matchesSearch && matchesSemester && matchesRisk && matchesBacklog && matchesCredit && matchesCategory;
  });

  // Export Filtered Student Data to CSV File
  const handleExportCSV = () => {
    if (filteredStudents.length === 0) return;

    // Build CSV Headers
    const headers = [
      "Roll Number",
      "Student Name",
      "Department",
      "Section",
      "Semester",
      "CGPA",
      "Earned Credits",
      "Active Backlogs",
      "Academic Risk",
      "Graduation Eligibility",
      "Category Deficiencies"
    ];

    // Build CSV Rows
    const csvRows = [
      headers.join(","),
      ...filteredStudents.map(s => [
        `"${s.rollNumber}"`,
        `"${s.name}"`,
        `"${s.department}"`,
        `"${s.section}"`,
        s.semester,
        s.cgpa.toFixed(2),
        s.totalEarnedCredits,
        s.backlogCount,
        s.riskLevel,
        s.isEligible ? "ELIGIBLE" : "PENDING",
        `"${s.categoryDeficiencies.join(", ")}"`
      ].join(","))
    ];

    // Create CSV Blob and trigger download
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BTech_Credit_Audited_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Filtering Header Toolbar */}
      <div className="glass-panel p-6 rounded-3xl border border-border space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Search className="w-4 h-4 text-primary" /> Advanced Search Filters
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Live Search bar */}
          <div className="lg:col-span-2 relative">
            <input
              type="text"
              placeholder="Search by Roll No, Name, or Section..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border focus:border-primary/50 rounded-xl py-2 px-3 pl-9 text-xs outline-none transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>

          {/* Semester Filter */}
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="w-full bg-background border border-border focus:border-primary/50 rounded-xl py-2 px-3 text-xs outline-none"
          >
            <option value="ALL">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
              <option key={sem} value={sem.toString()}>Semester {sem}</option>
            ))}
          </select>

          {/* Risk Level Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="w-full bg-background border border-border focus:border-primary/50 rounded-xl py-2 px-3 text-xs outline-none"
          >
            <option value="ALL">All Risk Profiles</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>

          {/* Backlog Filter */}
          <select
            value={backlogFilter}
            onChange={(e) => setBacklogFilter(e.target.value)}
            className="w-full bg-background border border-border focus:border-primary/50 rounded-xl py-2 px-3 text-xs outline-none"
          >
            <option value="ALL">All Backlog Status</option>
            <option value="YES">With Active Backlogs</option>
            <option value="NO">Clear of Backlogs</option>
          </select>

          {/* Credit Completion */}
          <select
            value={creditFilter}
            onChange={(e) => setCreditFilter(e.target.value)}
            className="w-full bg-background border border-border focus:border-primary/50 rounded-xl py-2 px-3 text-xs outline-none"
          >
            <option value="ALL">All Credit Totals</option>
            <option value="DEFICIENT">Short of 185 Credits</option>
            <option value="COMPLETE">Completed 185 Credits</option>
          </select>

          {/* Category Deficiency Selector */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-background border border-border focus:border-primary/50 rounded-xl py-2 px-3 text-xs outline-none"
          >
            <option value="ALL">All Category Requirements</option>
            <option value="HS">Deficient in HS (19 cr)</option>
            <option value="BS">Deficient in BS (21 cr)</option>
            <option value="ES">Deficient in ES (21 cr)</option>
            <option value="PC">Deficient in PC (54 cr)</option>
            <option value="PE">Deficient in PE (26 cr)</option>
            <option value="OE">Deficient in OE (12 cr)</option>
            <option value="PW">Deficient in PW (32 cr)</option>
            <option value="MNC">Deficient in MNC (4 courses)</option>
          </select>

          {/* Export and Metrics Counter */}
          <div className="lg:col-span-3 flex items-center justify-between pt-2 border-t border-border sm:border-t-0 sm:pt-0">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Showing <code className="text-primary font-mono">{filteredStudents.length}</code> of <code className="font-mono">{initialStudents.length}</code> student records
            </span>

            {filteredStudents.length > 0 && (
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-500/90 active:scale-[0.98] text-white text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 shadow transition-all shrink-0"
              >
                <Download className="w-3.5 h-3.5" /> Export Audited CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Students Grid Table */}
      <div className="glass-panel rounded-3xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-4 px-6 w-32">Roll Number</th>
                <th className="py-4 px-6">Student Name</th>
                <th className="py-4 px-6 w-24">Class/Sem</th>
                <th className="py-4 px-6 w-20">CGPA</th>
                <th className="py-4 px-6 w-32">Credits Earned</th>
                <th className="py-4 px-6 w-28">Backlogs</th>
                <th className="py-4 px-6 w-28">Risk Level</th>
                <th className="py-4 px-6 w-28">Graduation</th>
                <th className="py-4 px-6 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="font-bold">No students found matching filters.</p>
                    <p className="text-xs mt-1">Try relaxing your search terms or dropdown options.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.rollNumber} className="hover:bg-muted/15 transition-colors">
                    {/* Roll Number */}
                    <td className="py-4 px-6 font-mono font-bold text-foreground">
                      <Link
                        href={`/dashboard/students/${student.rollNumber}`}
                        className="hover:underline hover:text-primary transition-colors"
                      >
                        {student.rollNumber}
                      </Link>
                    </td>

                    {/* Student Name */}
                    <td className="py-4 px-6 font-semibold whitespace-nowrap">
                      {student.name}
                    </td>

                    {/* Class/Section/Sem */}
                    <td className="py-4 px-6 text-xs whitespace-nowrap">
                      <span className="font-bold text-foreground">{student.department}-{student.section}</span>
                      <span className="text-muted-foreground block">Semester {student.semester}</span>
                    </td>

                    {/* CGPA */}
                    <td className="py-4 px-6 font-mono font-bold">
                      {student.cgpa > 0 ? student.cgpa.toFixed(2) : "0.00"}
                    </td>

                    {/* Credits Earned */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                        student.totalEarnedCredits >= 185
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-amber-500/10 text-amber-500"
                      }`}>
                        {student.totalEarnedCredits} / 185 cr
                      </span>
                    </td>

                    {/* Active Backlogs */}
                    <td className="py-4 px-6">
                      {student.backlogCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          <AlertTriangle className="w-3.5 h-3.5" /> {student.backlogCount} Papers
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-500">
                          <CheckCircle className="w-3.5 h-3.5 shrink-0" /> Clear
                        </span>
                      )}
                    </td>

                    {/* Academic Risk Level */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        student.riskLevel === "HIGH"
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          : student.riskLevel === "MEDIUM"
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : "bg-slate-500/10 text-muted-foreground border-slate-500/20"
                      }`}>
                        {student.riskLevel}
                      </span>
                    </td>

                    {/* Graduation Ready */}
                    <td className="py-4 px-6">
                      {student.isEligible ? (
                        <span className="inline-flex items-center gap-1 text-emerald-500 text-xs font-bold">
                          <CheckCircle className="w-4 h-4 shrink-0" /> Ready
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs font-medium">
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Chevron Action */}
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/dashboard/students/${student.rollNumber}`}
                        className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors inline-block"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
