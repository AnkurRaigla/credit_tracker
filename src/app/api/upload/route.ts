import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { parseExcelOrCsvBuffer } from "@/lib/excelParser";
import { PASSING_GRADES, FAILING_GRADES, auditStudentCredits } from "@/lib/creditEngine";

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Authentication & Session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    // 2. Parse Multipart Form Data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // 3. Process File Buffer through dynamic matching parser
    const { records, errors: parserErrors } = await parseExcelOrCsvBuffer(buffer);

    if (records.length === 0) {
      return NextResponse.json({
        error: "Failed to parse grade records. Check file format.",
        details: parserErrors,
      }, { status: 422 });
    }

    let successCount = 0;
    const processWarnings: string[] = [];
    const touchedStudentRolls = new Set<string>();

    // 4. Process individual grade records within the database
    for (const record of records) {
      try {
        const rollNum = record.rollNumber;
        touchedStudentRolls.add(rollNum);

        // a. Resolve or Auto-Create Subject in Master Mapping Table
        let subject = await prisma.subjectMaster.findUnique({
          where: { code: record.subjectCode },
        });

        if (!subject) {
          const defaultCredits = record.credits !== undefined ? record.credits : 3.0;
          const defaultCategory = record.category ? record.category.toUpperCase() : "PC";
          
          subject = await prisma.subjectMaster.create({
            data: {
              code: record.subjectCode,
              name: record.subjectName,
              credits: defaultCredits,
              category: defaultCategory,
            },
          });
          processWarnings.push(
            `Subject "${record.subjectCode}" (${record.subjectName}) was not found in Curriculum Master. Auto-added as Category "${defaultCategory}" with ${defaultCredits} credits.`
          );
        }

        // b. Resolve or Create Student
        let student = await prisma.student.findUnique({
          where: { rollNumber: rollNum },
        });

        if (!student) {
          student = await prisma.student.create({
            data: {
              rollNumber: rollNum,
              name: record.studentName,
              section: record.section,
              department: record.department,
              semester: record.semester,
            },
          });
        } else {
          // Update student information with latest semester/details
          student = await prisma.student.update({
            where: { rollNumber: rollNum },
            data: {
              name: record.studentName,
              section: record.section,
              department: record.department,
              semester: Math.max(student.semester, record.semester),
            },
          });
        }

        // c. Check pass/fail status and calculate earned credits
        const gradeStr = record.grade.toUpperCase();
        const isPassed = PASSING_GRADES.includes(gradeStr) || gradeStr === "P";
        const isBacklog = FAILING_GRADES.includes(gradeStr) || gradeStr === "F";
        const earnedCredits = isPassed ? subject.credits : 0.0;

        // d. Upsert Grade record (Search if exists, then update or create)
        const existingGrade = await prisma.grade.findFirst({
          where: {
            studentId: rollNum,
            subjectCode: record.subjectCode,
            semester: record.semester,
          },
        });

        if (existingGrade) {
          await prisma.grade.update({
            where: { id: existingGrade.id },
            data: {
              grade: record.grade,
              earned: earnedCredits,
              isBacklog: isBacklog,
              credits: subject.credits,
              category: subject.category,
              subjectName: subject.name,
            },
          });
        } else {
          await prisma.grade.create({
            data: {
              studentId: rollNum,
              subjectCode: record.subjectCode,
              semester: record.semester,
              grade: record.grade,
              earned: earnedCredits,
              isBacklog: isBacklog,
              credits: subject.credits,
              category: subject.category,
              subjectName: subject.name,
            },
          });
        }

        successCount++;
      } catch (err: any) {
        processWarnings.push(
          `Roll: ${record.rollNumber}, Subject: ${record.subjectCode} — Skipping due to database write failure: ${err.message}`
        );
      }
    }

    // 5. Dynamic Recalculation of Student CGPAs
    for (const roll of touchedStudentRolls) {
      try {
        const studentGrades = await prisma.grade.findMany({
          where: { studentId: roll },
        });
        
        // Audit to get latest CGPA
        const audit = auditStudentCredits(
          studentGrades.map(g => ({
            subjectCode: g.subjectCode,
            subjectName: g.subjectName,
            credits: g.credits,
            category: g.category,
            semester: g.semester,
            grade: g.grade,
          }))
        );

        // Update student's CGPA in Student record
        await prisma.student.update({
          where: { rollNumber: roll },
          data: { cgpa: audit.cgpa },
        });
      } catch (err: any) {
        console.error(`Failed to update CGPA for student ${roll}:`, err);
      }
    }

    return NextResponse.json({
      message: "Data ingestion completed successfully.",
      summary: {
        totalParsedRows: records.length,
        successfullyIngested: successCount,
        failedRows: records.length - successCount,
        touchedStudentsCount: touchedStudentRolls.size,
      },
      warnings: [...parserErrors, ...processWarnings],
    });
  } catch (error: any) {
    console.error("Ingestion POST API Error:", error);
    return NextResponse.json({ error: "A server-side parsing error occurred. Please verify your file." }, { status: 500 });
  }
}
