import * as XLSX from "xlsx";
import prisma from "@/lib/db";

export interface ParsedGradeRecord {
  rollNumber: string;
  studentName: string;
  department: string;
  section: string;
  semester: number;
  subjectCode: string;
  subjectName: string;
  grade: string;
  credits?: number;  // Optional, fallback to SubjectMaster
  category?: string; // Optional, fallback to SubjectMaster
}

// Synonyms for mapping Excel/CSV columns dynamically
const HEADER_MAPS = {
  rollNumber: ["ROLL NUMBER", "ROLLNO", "ROLL_NO", "STUDENT_ID", "ROLL", "REG_NO", "REGISTRATION NUMBER"],
  studentName: ["STUDENT NAME", "NAME", "STUDENTNAME", "STUDENT_NAME", "FULL_NAME", "FULL NAME"],
  department: ["DEPARTMENT", "BRANCH", "DEPT", "STREAM"],
  section: ["SECTION", "SEC", "CLASS"],
  semester: ["SEMESTER", "SEM", "TERM"],
  subjectCode: ["SUBJECT CODE", "SUBCODE", "SUBJECTCODE", "COURSECODE", "COURSE CODE", "SUB_CODE"],
  subjectName: ["SUBJECT NAME", "SUBNAME", "SUBJECTNAME", "COURSENAME", "COURSE NAME", "SUB_NAME"],
  grade: ["GRADE", "RESULT", "LETTER_GRADE", "LETTER GRADE"],
  credits: ["CREDITS", "CREDIT", "CR"],
  category: ["CATEGORY", "COURSETYPE", "COURSE TYPE", "CAT"],
};

/**
 * Standardizes a column name to look for synonyms
 */
function normalizeHeader(raw: string): string {
  return raw.toString().trim().toUpperCase().replace(/[\s\-_]/g, " ");
}

/**
 * Parses an Excel or CSV buffer and returns structured grade records
 */
export async function parseExcelOrCsvBuffer(
  buffer: Buffer
): Promise<{ records: ParsedGradeRecord[]; errors: string[] }> {
  const errors: string[] = [];
  const records: ParsedGradeRecord[] = [];

  try {
    // Read the workbook from buffer
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Parse sheet as raw JSON rows (header: 1 returns array of arrays)
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    if (rawData.length < 2) {
      return { records: [], errors: ["Uploaded file is empty or missing headers."] };
    }

    // Extract headers (first row)
    const rawHeaders = rawData[0].map(h => (h !== undefined && h !== null ? h.toString() : ""));
    const columnIndices: Record<string, number> = {};

    // Match raw headers to normalized fields based on synonyms
    for (const key in HEADER_MAPS) {
      const synonyms = HEADER_MAPS[key as keyof typeof HEADER_MAPS];
      let foundIndex = -1;

      for (let i = 0; i < rawHeaders.length; i++) {
        const normalizedRaw = normalizeHeader(rawHeaders[i]);
        if (synonyms.some(synonym => normalizedRaw === synonym || normalizedRaw.includes(synonym))) {
          foundIndex = i;
          break;
        }
      }

      if (foundIndex !== -1) {
        columnIndices[key] = foundIndex;
      }
    }

    // Validate critical headers
    const requiredKeys = ["rollNumber", "studentName", "subjectCode", "grade", "semester"];
    const missingKeys = requiredKeys.filter(key => columnIndices[key] === undefined);

    if (missingKeys.length > 0) {
      return {
        records: [],
        errors: [
          `Failed to map critical headers. Missing columns or synonyms for: ${missingKeys
            .map(k => k.charAt(0).toUpperCase() + k.slice(1))
            .join(", ")}.`,
        ],
      };
    }

    // Process data rows
    for (let r = 1; r < rawData.length; r++) {
      const row = rawData[r];
      if (!row || row.length === 0 || row.every(val => val === null || val === undefined || val === "")) {
        continue; // Skip blank rows
      }

      const getValue = (key: string): string => {
        const idx = columnIndices[key];
        if (idx === undefined || row[idx] === undefined || row[idx] === null) return "";
        return row[idx].toString().trim();
      };

      const rollNumber = getValue("rollNumber").toUpperCase();
      const studentName = getValue("studentName");
      const subjectCode = getValue("subjectCode").toUpperCase();
      const grade = getValue("grade").toUpperCase();
      const semesterRaw = getValue("semester");
      
      const department = getValue("department") || "CSE"; // Default to CSE if blank
      const section = getValue("section") || "A";         // Default to A if blank
      const subjectName = getValue("subjectName") || `${subjectCode} Subject`;
      
      const creditsVal = getValue("credits");
      const categoryVal = getValue("category");

      // Verify values
      if (!rollNumber || !studentName || !subjectCode || !grade) {
        errors.push(`Row ${r + 1}: Skipping due to missing Student Roll, Name, Subject Code, or Grade.`);
        continue;
      }

      const semester = parseInt(semesterRaw, 10);
      if (isNaN(semester) || semester < 1 || semester > 8) {
        errors.push(`Row ${r + 1} (Roll: ${rollNumber}): Invalid semester value "${semesterRaw}". Must be 1-8.`);
        continue;
      }

      const parsedRecord: ParsedGradeRecord = {
        rollNumber,
        studentName,
        department,
        section,
        semester,
        subjectCode,
        subjectName,
        grade,
      };

      if (creditsVal) {
        parsedRecord.credits = parseFloat(creditsVal);
      }
      if (categoryVal) {
        parsedRecord.category = categoryVal;
      }

      records.push(parsedRecord);
    }
  } catch (err) {
    console.error("Excel parser error:", err);
    return { records: [], errors: ["An error occurred while parsing the spreadsheet layout."] };
  }

  return { records, errors };
}
