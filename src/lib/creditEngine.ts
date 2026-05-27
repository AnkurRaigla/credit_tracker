// B.Tech Academic Credit Tracking Engine

export interface CourseGrade {
  subjectCode: string;
  subjectName: string;
  credits: number;
  category: string; // HS, BS, ES, PC, PE, OE, PW, MNC
  semester: number;
  grade: string; // O, A+, A, B+, B, C, P, F, Ab, etc.
}

export interface CreditRequirement {
  category: string;
  required: number;
  earned: number;
  shortage: number;
}

export interface BacklogInfo {
  subjectCode: string;
  subjectName: string;
  semesterFailed: number;
  grade: string;
  isCleared: boolean;
}

export interface StudentAuditReport {
  totalEarnedCredits: number;
  totalRequiredCredits: number; // 185
  overallProgressPercentage: number;
  cgpa: number;
  categoryReport: CreditRequirement[];
  activeBacklogs: BacklogInfo[];
  clearedBacklogs: BacklogInfo[];
  mncCoursesCompleted: number;
  mncCoursesPending: number;
  mncStatus: "COMPLETED" | "PENDING";
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  riskReasons: string[];
  isEligibleForGraduation: boolean;
}

// Target B.Tech credit rules
export const CREDIT_STRUCTURE: Record<string, number> = {
  HS: 19,  // Humanities and Social Sciences
  BS: 21,  // Basic Sciences
  ES: 21,  // Engineering Sciences
  PC: 54,  // Professional Core
  PE: 26,  // Professional Elective
  OE: 12,  // Open Elective
  PW: 32,  // Project Work
};

// MNC courses target
export const REQUIRED_MNC_COUNT = 4;

// Passing grades
export const PASSING_GRADES = ["O", "A+", "A", "B+", "B", "C", "P", "S"];
// Failing grades
export const FAILING_GRADES = ["F", "AB", "ABS", "ABSENT", "I", "W", "U"];

// Grade to GPA Point mapping
export const GRADE_POINTS: Record<string, number> = {
  "O": 10,
  "A+": 9,
  "A": 8,
  "B+": 7,
  "B": 6,
  "C": 5,
  "P": 4,
  "S": 10, // Non-credit Pass default
  "F": 0,
  "AB": 0,
  "ABS": 0,
  "ABSENT": 0,
  "I": 0,
  "W": 0,
  "U": 0, // MNC Fail
};

/**
 * Calculates academic audit results for a student based on their complete grade history
 */
export function auditStudentCredits(grades: CourseGrade[]): StudentAuditReport {
  // 1. Group grades by subjectCode to find chronological latest grade
  const subjectGroups: Record<string, CourseGrade[]> = {};
  
  for (const grade of grades) {
    const code = grade.subjectCode.toUpperCase();
    if (!subjectGroups[code]) {
      subjectGroups[code] = [];
    }
    subjectGroups[code].push(grade);
  }

  // Sort grades within each subject chronologically by semester
  // This allows us to find if backlogs have been cleared
  const latestGrades: Record<string, CourseGrade> = {};
  const activeBacklogsList: BacklogInfo[] = [];
  const clearedBacklogsList: BacklogInfo[] = [];

  for (const code in subjectGroups) {
    const group = subjectGroups[code];
    group.sort((a, b) => a.semester - b.semester);
    
    // The last element is the latest attempt
    const latest = group[group.length - 1];
    latestGrades[code] = latest;

    // Track backlog history
    const failedAttempts = group.filter(g => {
      const gStr = g.grade.toUpperCase();
      return FAILING_GRADES.includes(gStr) || gStr === "F";
    });

    if (failedAttempts.length > 0) {
      const latestGradeStr = latest.grade.toUpperCase();
      const isCurrentlyPassed = PASSING_GRADES.includes(latestGradeStr) || latestGradeStr === "P";

      for (const attempt of failedAttempts) {
        const backlogInfo: BacklogInfo = {
          subjectCode: attempt.subjectCode,
          subjectName: attempt.subjectName,
          semesterFailed: attempt.semester,
          grade: attempt.grade,
          isCleared: isCurrentlyPassed,
        };

        if (isCurrentlyPassed) {
          clearedBacklogsList.push(backlogInfo);
        } else {
          // If the latest attempt is failed, it is an active backlog
          if (attempt === latest) {
            activeBacklogsList.push(backlogInfo);
          }
        }
      }
    }
  }

  // 2. Compute earned credits and category breakdowns based on LATEST attempts
  let totalEarnedNumericCredits = 0;
  const categoryEarned: Record<string, number> = {
    HS: 0, BS: 0, ES: 0, PC: 0, PE: 0, OE: 0, PW: 0, MNC: 0
  };
  
  // Track unique passed MNC courses
  const passedMncSubjects = new Set<string>();

  for (const code in latestGrades) {
    const record = latestGrades[code];
    const gradeStr = record.grade.toUpperCase();
    const isPassed = PASSING_GRADES.includes(gradeStr) || gradeStr === "P" || record.credits > 0 && !FAILING_GRADES.includes(gradeStr);

    if (isPassed) {
      const cat = record.category.toUpperCase();
      if (cat === "MNC") {
        passedMncSubjects.add(code);
      } else {
        const earnedVal = record.credits;
        categoryEarned[cat] = (categoryEarned[cat] || 0) + earnedVal;
        totalEarnedNumericCredits += earnedVal;
      }
    }
  }

  // 3. Compile Category Requirements Report
  const categoryReport: CreditRequirement[] = Object.keys(CREDIT_STRUCTURE).map(cat => {
    const required = CREDIT_STRUCTURE[cat];
    const earned = categoryEarned[cat] || 0;
    const shortage = Math.max(0, required - earned);
    return {
      category: cat,
      required,
      earned,
      shortage,
    };
  });

  // 4. Calculate CGPA based on latest passed and failed attempts (excluding MNC)
  let totalGradePoints = 0;
  let totalCreditsForGpa = 0;

  for (const code in latestGrades) {
    const record = latestGrades[code];
    const cat = record.category.toUpperCase();
    if (cat === "MNC") continue; // Exclude MNC from CGPA

    const gradeStr = record.grade.toUpperCase();
    const gp = GRADE_POINTS[gradeStr] !== undefined ? GRADE_POINTS[gradeStr] : 0;
    
    totalGradePoints += gp * record.credits;
    totalCreditsForGpa += record.credits;
  }

  const cgpa = totalCreditsForGpa > 0 ? Number((totalGradePoints / totalCreditsForGpa).toFixed(2)) : 0.0;

  // 5. Mandatory Non-Credit Course Status
  const mncCoursesCompleted = passedMncSubjects.size;
  const mncCoursesPending = Math.max(0, REQUIRED_MNC_COUNT - mncCoursesCompleted);
  const mncStatus = mncCoursesCompleted >= REQUIRED_MNC_COUNT ? "COMPLETED" : "PENDING";

  // 6. Assess Graduation Eligibility
  // Eligible if numeric credits >= 185, all category shortages are 0, MNC is completed, and 0 active backlogs
  const targetRequiredTotal = 185;
  const hasShortage = categoryReport.some(r => r.shortage > 0);
  const hasBacklogs = activeBacklogsList.length > 0;
  const isEligibleForGraduation = 
    totalEarnedNumericCredits >= targetRequiredTotal && 
    !hasShortage && 
    mncStatus === "COMPLETED" && 
    !hasBacklogs;

  // 7. Calculate overall progress percentage towards 185 credits
  const overallProgressPercentage = Math.min(100, Math.round((totalEarnedNumericCredits / targetRequiredTotal) * 100));

  // 8. Analyze Academic Risk Level
  const riskReasons: string[] = [];
  let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";

  if (activeBacklogsList.length > 2) {
    riskLevel = "HIGH";
    riskReasons.push(`Student has ${activeBacklogsList.length} active backlogs.`);
  } else if (activeBacklogsList.length > 0) {
    riskLevel = "MEDIUM";
    riskReasons.push(`Student has ${activeBacklogsList.length} active backlog(s).`);
  }

  if (cgpa < 5.0 && cgpa > 0) {
    riskLevel = "HIGH";
    riskReasons.push(`Low CGPA of ${cgpa.toFixed(2)} (under 5.0).`);
  } else if (cgpa < 6.5 && cgpa > 0 && riskLevel !== "HIGH") {
    riskLevel = "MEDIUM";
    riskReasons.push(`Moderate CGPA of ${cgpa.toFixed(2)} (under 6.5).`);
  }

  // Calculate credit shortages
  const totalShortage = categoryReport.reduce((acc, curr) => acc + curr.shortage, 0);
  if (totalShortage > 30) {
    riskLevel = "HIGH";
    riskReasons.push(`Significant credit shortage of ${totalShortage} credits across categories.`);
  } else if (totalShortage > 15 && riskLevel !== "HIGH") {
    riskLevel = "MEDIUM";
    riskReasons.push(`Credit shortage of ${totalShortage} credits.`);
  }

  if (mncCoursesPending > 2) {
    riskReasons.push(`Pending ${mncCoursesPending} Mandatory Non-Credit (MNC) courses.`);
    if (riskLevel !== "HIGH") riskLevel = "MEDIUM";
  }

  return {
    totalEarnedCredits: totalEarnedNumericCredits,
    totalRequiredCredits: targetRequiredTotal,
    overallProgressPercentage,
    cgpa,
    categoryReport,
    activeBacklogs: activeBacklogsList,
    clearedBacklogs: clearedBacklogsList,
    mncCoursesCompleted,
    mncCoursesPending,
    mncStatus,
    riskLevel,
    riskReasons,
    isEligibleForGraduation,
  };
}
