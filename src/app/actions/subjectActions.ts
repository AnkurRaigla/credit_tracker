"use server";

import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { auditStudentCredits } from "@/lib/creditEngine";

/**
 * Creates a new subject mapping in SubjectMaster
 */
export async function createSubjectAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: "Unauthorized. Admin role is required." };
  }

  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const name = (formData.get("name") as string)?.trim();
  const creditsRaw = formData.get("credits") as string;
  const category = (formData.get("category") as string)?.trim().toUpperCase();

  if (!code || !name || !creditsRaw || !category) {
    return { error: "All fields are required to create a subject." };
  }

  const credits = parseFloat(creditsRaw);
  if (isNaN(credits) || credits < 0) {
    return { error: "Credits must be a non-negative number." };
  }

  try {
    const existing = await prisma.subjectMaster.findUnique({ where: { code } });
    if (existing) {
      return { error: `Subject code "${code}" already exists in Master.` };
    }

    await prisma.subjectMaster.create({
      data: { code, name, credits, category },
    });

    revalidatePath("/dashboard/subjects");
    return { success: `Successfully created subject mapping for ${code}.` };
  } catch (error: any) {
    console.error("Create subject action error:", error);
    return { error: "Failed to create subject. Please try again." };
  }
}

/**
 * Updates an existing subject mapping, cascading changes and recalculating credits/CGPA
 */
export async function updateSubjectAction(
  code: string,
  name: string,
  credits: number,
  category: string
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: "Unauthorized. Admin role is required." };
  }

  if (!code || !name || credits < 0 || !category) {
    return { error: "Invalid data provided for subject update." };
  }

  try {
    // 1. Fetch current subject mapping to check if credits or category changed
    const currentSubject = await prisma.subjectMaster.findUnique({
      where: { code },
    });

    if (!currentSubject) {
      return { error: "Subject not found." };
    }

    const wasUpdated = 
      currentSubject.credits !== credits || 
      currentSubject.category !== category ||
      currentSubject.name !== name;

    // 2. Update SubjectMaster
    await prisma.subjectMaster.update({
      where: { code },
      data: { name, credits, category },
    });

    if (wasUpdated) {
      // 3. Cascade updates to all Grades referencing this subject code
      // We must recalculate the grade 'earned' value based on new credits (if passed)
      const gradesToUpdate = await prisma.grade.findMany({
        where: { subjectCode: code },
      });

      const affectedStudentRolls = new Set<string>();

      for (const grade of gradesToUpdate) {
        affectedStudentRolls.add(grade.studentId);
        
        // Calculate new earned credits: if earned was > 0, it means they passed
        const hasPassed = grade.earned > 0;
        const newEarned = hasPassed ? credits : 0.0;

        await prisma.grade.update({
          where: { id: grade.id },
          data: {
            subjectName: name,
            credits: credits,
            category: category,
            earned: newEarned,
          },
        });
      }

      // 4. Recalculate CGPA and credits for all affected students in real time
      for (const roll of affectedStudentRolls) {
        const studentGrades = await prisma.grade.findMany({
          where: { studentId: roll },
        });

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

        await prisma.student.update({
          where: { rollNumber: roll },
          data: { cgpa: audit.cgpa },
        });
      }
    }

    revalidatePath("/dashboard/subjects");
    return { success: `Successfully updated subject ${code} and recalculated student audits.` };
  } catch (error: any) {
    console.error("Update subject action error:", error);
    return { error: "Failed to update subject. Please try again." };
  }
}

/**
 * Deletes a subject mapping (only if it has no associated grade transcripts, or cascading)
 */
export async function deleteSubjectAction(code: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: "Unauthorized. Admin role is required." };
  }

  try {
    // Check if any student grades are tied to this subject code
    const gradeCount = await prisma.grade.count({
      where: { subjectCode: code },
    });

    if (gradeCount > 0) {
      return {
        error: `Cannot delete subject "${code}". It is referenced in ${gradeCount} student transcript records. Remove those records first.`,
      };
    }

    await prisma.subjectMaster.delete({
      where: { code },
    });

    revalidatePath("/dashboard/subjects");
    return { success: `Successfully deleted subject mapping for ${code}.` };
  } catch (error: any) {
    console.error("Delete subject action error:", error);
    return { error: "Failed to delete subject. Please try again." };
  }
}
