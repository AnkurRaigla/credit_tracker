import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { auditStudentCredits } from "@/lib/creditEngine";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const rollNumber = searchParams.get("rollNumber")?.trim().toUpperCase();

    if (!rollNumber) {
      return NextResponse.json({ error: "Roll number parameter is required." }, { status: 400 });
    }

    // 2. Fetch Student Profile and transcripts
    const student = await prisma.student.findUnique({
      where: { rollNumber },
      include: { grades: true },
    });

    if (!student) {
      return NextResponse.json({ error: `Student record with Roll Number "${rollNumber}" not found.` }, { status: 404 });
    }

    // 3. Compute credit audit
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

    // 4. Construct prompt for Gemini
    const studentProfileStr = `
Student Name: ${student.name}
Roll Number: ${student.rollNumber}
Department: ${student.department}
Section: ${student.section}
Current Semester: ${student.semester}
Current CGPA: ${audit.cgpa.toFixed(2)}

CREDIT AUDIT SUMMARY (Target: 185 Credits):
- Earned Credits: ${audit.totalEarnedCredits} / 185
- MNC Courses Completed: ${audit.mncCoursesCompleted} / 4
- MNC Status: ${audit.mncStatus}
- Active Backlogs: ${audit.activeBacklogs.length} papers
${audit.activeBacklogs.map(b => `  * ${b.subjectCode}: ${b.subjectName} (Failed in Sem ${b.semesterFailed} with Grade ${b.grade})`).join("\n")}

CATEGORY COMPLIANCE AUDIT:
${audit.categoryReport.map(r => `- ${r.category}: ${r.earned} cr earned (Required: ${r.required} cr, Shortage: ${r.shortage} cr)`).join("\n")}

HISTORICAL CLEARED BACKLOGS:
${audit.clearedBacklogs.length > 0 
  ? audit.clearedBacklogs.map(b => `  * ${b.subjectCode}: ${b.subjectName} (Failed in Sem ${b.semesterFailed}, successfully cleared)`).join("\n")
  : "None"}

ACADEMIC RISK ASSESSMENT:
- Risk Level: ${audit.riskLevel}
- Risk Flags: ${audit.riskReasons.join(", ")}
`;

    // Check if user has configured the Gemini / Groq API Key
    const apiKey = process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY;

    if (!apiKey) {
      // Return a highly realistic, tailored mock counseling report
      const mockReport = generateMockCounselingReport(student.name, audit);
      return NextResponse.json({ analysis: mockReport, isMock: true });
    }

    if (apiKey.startsWith("gsk_")) {
      // 5a. Call Groq API (OpenAI compatible high-speed inference)
      console.log("Using Groq API for counseling report generation...");
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Here is the student's profile:\n${studentProfileStr}` }
            ],
            temperature: 0.2
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Groq API error response:", errorData);
          throw new Error(`Groq API error: ${response.statusText}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (!text) {
          throw new Error("Empty response from Groq API");
        }

        return NextResponse.json({ analysis: text, isMock: false });
      } catch (err) {
        console.error("Groq API call failed, falling back to local simulation:", err);
        const mockReport = generateMockCounselingReport(student.name, audit);
        return NextResponse.json({ 
          analysis: mockReport + "\n\n*(Note: Groq API call encountered a transient error. Switched to local counseling simulation).* ", 
          isMock: true 
        });
      }
    }

    // 5b. Initialize Gemini Client & Generate Analysis (Standard Fallback)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `You are a professional B.Tech Academic Advisor and Counselor at an engineering university.
Your task is to analyze the student's credit audit profile and provide a thorough, actionable counseling and graduation eligibility report.
Speak directly to the Class Advisor/Coordinator. Be precise, professional, and highlight critical warnings using markdown.

Please format your response clearly with these sections:
### 1. Graduation Path Audit
- Audit their current progress towards 185 credits. Flag any category shortages.
- Assess their Mandatory Non-Credit (MNC) course completion.

### 2. Backlog Clearance Action Plan
- Provide specific advice on how and when the student must clear their active backlogs.
- Prioritize core courses and check prerequisites.

### 3. Elective Completion Strategy
- Recommend choices for Professional Electives (PE) and Open Electives (OE) based on their credit deficits.

### 4. Advisor Recommendation Summary
- Deliver 3-4 bulletproof, actionable recommendations for the Class Advisor (e.g. remedial classes, warning letters, or graduation sign-offs).`;

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: `${systemPrompt}\n\nHere is the student's profile:\n${studentProfileStr}` }] }
      ]
    });

    const text = result.response.text();
    return NextResponse.json({ analysis: text, isMock: false });
  } catch (error: any) {
    console.error("AI Predict API Error:", error);
    return NextResponse.json({ error: "Failed to generate AI prediction report. Please try again." }, { status: 500 });
  }
}

/**
 * Generates an extremely premium, rule-driven mock counseling report as a robust fallback
 */
function generateMockCounselingReport(name: string, audit: ReturnType<typeof auditStudentCredits>): string {
  const shortagesStr = audit.categoryReport
    .filter(r => r.shortage > 0)
    .map(r => `* **${r.category}**: Shortage of **${r.shortage} credits** (Completed: ${r.earned}/${r.required} cr)`)
    .join("\n");

  const backlogAction = audit.activeBacklogs.length > 0
    ? `### 2. Backlog Clearance Action Plan
The student currently has **${audit.activeBacklogs.length} active backlog(s)**. Clearing these must be the absolute highest priority:
${audit.activeBacklogs.map((b, i) => `${i + 1}. **${b.subjectCode} - ${b.subjectName}**: Failed in Semester ${b.semesterFailed} with grade "${b.grade}". 
   * *Action Plan*: The student must register for the remedial/re-appearance exam in the next immediate winter/summer term. Advise them to attend regular tutorial coaching sessions.`).join("\n")}`
    : `### 2. Backlog Clearance Action Plan
* **Excellent Standing**: The student has **0 active backlogs**. All registered courses are successfully passed.
* **Historical Notes**: The student has successfully cleared ${audit.clearedBacklogs.length} past backlogs, showing positive academic recovery.`;

  const electiveAdvice = audit.categoryReport.find(r => r.category === "PE")?.shortage || 0;
  const openElectiveAdvice = audit.categoryReport.find(r => r.category === "OE")?.shortage || 0;

  return `## 🧠 Gemini Academic Advisor Counseling Report

* **Student Profile**: **${name}**
* **Audit Profile Warning Level**: **${audit.riskLevel} Risk**
* **Report Mode**: *Deep-Counseling Model v1.5 (Standard Fallback)*

---

### 1. Graduation Path Audit
* **Credit Progress**: Completed **${audit.totalEarnedCredits}** out of the required **185 B.Tech Credits** (${audit.overallProgressPercentage}% completed). 
* **Category Deficiencies**:
${shortagesStr || "* **No Category Shortages**: The student has successfully met the credit thresholds across all 7 B.Tech structural categories."}
* **MNC Audit**: Completed **${audit.mncCoursesCompleted}/4** Mandatory Non-Credit courses.
  * Status: **${audit.mncStatus === "COMPLETED" ? "✅ Completed" : "⚠️ Deficient (MNC requirements pending)"}**

---

${backlogAction}

---

### 3. Elective Completion Strategy
* **Professional Elective (PE) Deficiency**: The student has **${electiveAdvice} credits** pending in Professional Electives.
  * *Recommendation*: Suggest registering for specialized streams like *Artificial Intelligence* or *Cloud Computing* in the upcoming semester.
* **Open Elective (OE) Deficiency**: The student has **${openElectiveAdvice} credits** pending in Open Electives.
  * *Recommendation*: Suggest taking inter-departmental courses such as *IoT* or *Cybersecurity* which have high pass rates.

---

### 4. Advisor Recommendation Summary
${audit.riskLevel === "HIGH" 
  ? `* 🚨 **Immediate Advisor Counseling**: Schedule an urgent parent-teacher meeting to discuss the ${audit.activeBacklogs.length} active backlogs and low performance.
* 📚 **Remedial Tutorial Enrollment**: Mandate attendance in extra coaching classes for core subjects.
* 📋 **Academic Contract**: Draft an academic performance contract specifying credit targets for the next term.`
  : audit.riskLevel === "MEDIUM"
  ? `* ⚠️ **Advisory Monitor**: Monitor the student's registrations in the upcoming semester to ensure they prioritize clearing backlogs over new registrations.
* 🤝 **Peer Mentorship**: Connect the student with a peer tutor to assist with their backlog preparation.
* 📑 **Elective Planning**: Help the student map out their remaining ${electiveAdvice + openElectiveAdvice} elective credits.`
  : `* ✅ **Graduation Sign-off Ready**: The student has satisfied all academic credit requirements, cleared all backlogs, and is ready for degree sign-off!
* 🎓 **Career Guidance**: Provide guidance on Capstone projects or industry placements.`}
`;
}
