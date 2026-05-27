const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

// Instantiate adapter by passing options object with 'url'
const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

// Passing grades
const PASSING_GRADES = ["O", "A+", "A", "B+", "B", "C", "P", "S"];
// Failing grades
const FAILING_GRADES = ["F", "AB", "ABS", "ABSENT", "I", "W", "U"];

// Grade to GPA Point mapping
const GRADE_POINTS = {
  "O": 10, "A+": 9, "A": 8, "B+": 7, "B": 6, "C": 5, "P": 4, "S": 10,
  "F": 0, "AB": 0, "ABS": 0, "ABSENT": 0, "I": 0, "W": 0, "U": 0
};

async function main() {
  console.log("Ingesting mock student transcripts...");

  // 1. Clear existing student and grade data
  await prisma.grade.deleteMany();
  await prisma.student.deleteMany();
  console.log("Cleared existing student and grade records.");

  // 2. Define Student 1: Arjun Kumar (Sem 6, Good standing, 0 backlogs)
  await prisma.student.create({
    data: {
      rollNumber: "22ADR001",
      name: "Arjun Kumar",
      department: "CSE",
      section: "A",
      semester: 6,
      cgpa: 8.43,
    },
  });

  const arjunGrades = [
    { subjectCode: "HS101", grade: "A", semester: 1 },
    { subjectCode: "BS101", grade: "O", semester: 1 },
    { subjectCode: "BS102", grade: "A+", semester: 1 },
    { subjectCode: "ES101", grade: "B+", semester: 1 },
    { subjectCode: "ES102", grade: "A", semester: 1 },
    { subjectCode: "BS103", grade: "O", semester: 2 },
    { subjectCode: "ES103", grade: "B", semester: 2 },
    { subjectCode: "CS101", grade: "A", semester: 2 },
    { subjectCode: "CS102", grade: "B+", semester: 2 },
    { subjectCode: "MNC01", grade: "S", semester: 2 }, // MNC Pass
    { subjectCode: "CS201", grade: "A+", semester: 3 },
    { subjectCode: "CS202", grade: "A", semester: 3 },
    { subjectCode: "CSPE01", grade: "A", semester: 4 },
    { subjectCode: "CS203", grade: "O", semester: 4 },
    { subjectCode: "MNC02", grade: "S", semester: 4 }, // MNC Pass
  ];

  // 3. Define Student 2: Bhavana S (Sem 6, 1 active backlog in CS201 Algorithms)
  await prisma.student.create({
    data: {
      rollNumber: "22ADR002",
      name: "Bhavana S",
      department: "CSE",
      section: "A",
      semester: 6,
      cgpa: 6.22,
    },
  });

  const bhavanaGrades = [
    { subjectCode: "HS101", grade: "B+", semester: 1 },
    { subjectCode: "BS101", grade: "B", semester: 1 },
    { subjectCode: "BS102", grade: "C", semester: 1 },
    { subjectCode: "ES101", grade: "P", semester: 1 },
    { subjectCode: "ES102", grade: "B", semester: 1 },
    { subjectCode: "BS103", grade: "A", semester: 2 },
    { subjectCode: "ES103", grade: "B+", semester: 2 },
    { subjectCode: "CS101", grade: "B", semester: 2 },
    { subjectCode: "CS102", grade: "C", semester: 2 },
    { subjectCode: "MNC01", grade: "S", semester: 2 },
    { subjectCode: "CS201", grade: "F", semester: 3 }, // Active Backlog!
    { subjectCode: "CS202", grade: "B", semester: 3 },
    { subjectCode: "CSPE01", grade: "B+", semester: 4 },
  ];

  // 4. Define Student 3: Charan Tej (Sem 6, Cleared Backlog in CS101 Data Structures)
  await prisma.student.create({
    data: {
      rollNumber: "22ADR003",
      name: "Charan Tej",
      department: "CSE",
      section: "B",
      semester: 6,
      cgpa: 7.15,
    },
  });

  const charanGrades = [
    { subjectCode: "HS101", grade: "A", semester: 1 },
    { subjectCode: "BS101", grade: "B+", semester: 1 },
    { subjectCode: "BS102", grade: "B", semester: 1 },
    { subjectCode: "ES101", grade: "A", semester: 1 },
    { subjectCode: "ES102", grade: "B+", semester: 1 },
    { subjectCode: "BS103", grade: "B", semester: 2 },
    { subjectCode: "ES103", grade: "B+", semester: 2 },
    { subjectCode: "CS101", grade: "F", semester: 2 }, // Failed DS in Sem 2!
    { subjectCode: "CS102", grade: "A", semester: 2 },
    { subjectCode: "MNC01", grade: "S", semester: 2 },
    { subjectCode: "CS201", grade: "B+", semester: 3 },
    { subjectCode: "CS202", grade: "B", semester: 3 },
    { subjectCode: "CS101", grade: "B+", semester: 4 }, // Passed DS in Sem 4 (Backlog Cleared!)
    { subjectCode: "CSPE01", grade: "A", semester: 4 },
  ];

  // 5. Define Student 4: Divya Sri (Sem 8, 100% Eligible for Graduation!)
  await prisma.student.create({
    data: {
      rollNumber: "22ADR004",
      name: "Divya Sri",
      department: "CSE",
      section: "B",
      semester: 8,
      cgpa: 9.35,
    },
  });

  // Divya has completed the FULL B.Tech requirements (HS 19, BS 21, ES 21, PC 54, PE 26, OE 12, PW 32, MNC 4)
  const divyaGrades = [
    // HS (Humanities & Social Sciences) - 19 credits target
    { subjectCode: "HS101", grade: "O", semester: 1, dynamicCredits: 10, dynamicCategory: "HS" },
    { subjectCode: "HS201", grade: "A+", semester: 2, dynamicCredits: 9, dynamicCategory: "HS" },
    
    // BS (Basic Sciences) - 21 credits target
    { subjectCode: "BS101", grade: "A+", semester: 1, dynamicCredits: 7, dynamicCategory: "BS" },
    { subjectCode: "BS102", grade: "O", semester: 1, dynamicCredits: 7, dynamicCategory: "BS" },
    { subjectCode: "BS103", grade: "A", semester: 2, dynamicCredits: 7, dynamicCategory: "BS" },

    // ES (Engineering Sciences) - 21 credits target
    { subjectCode: "ES101", grade: "A", semester: 1, dynamicCredits: 7, dynamicCategory: "ES" },
    { subjectCode: "ES102", grade: "A+", semester: 1, dynamicCredits: 7, dynamicCategory: "ES" },
    { subjectCode: "ES103", grade: "O", semester: 2, dynamicCredits: 7, dynamicCategory: "ES" },

    // PC (Professional Core) - 54 credits target
    { subjectCode: "CS101", grade: "O", semester: 2, dynamicCredits: 9, dynamicCategory: "PC" },
    { subjectCode: "CS102", grade: "A+", semester: 2, dynamicCredits: 9, dynamicCategory: "PC" },
    { subjectCode: "CS201", grade: "O", semester: 3, dynamicCredits: 9, dynamicCategory: "PC" },
    { subjectCode: "CS202", grade: "A", semester: 3, dynamicCredits: 9, dynamicCategory: "PC" },
    { subjectCode: "CS203", grade: "A+", semester: 4, dynamicCredits: 9, dynamicCategory: "PC" },
    { subjectCode: "CS301", grade: "O", semester: 5, dynamicCredits: 9, dynamicCategory: "PC" },

    // PE (Professional Elective) - 26 credits target
    { subjectCode: "CSPE01", grade: "A+", semester: 4, dynamicCredits: 8, dynamicCategory: "PE" },
    { subjectCode: "CSPE02", grade: "O", semester: 5, dynamicCredits: 9, dynamicCategory: "PE" },
    { subjectCode: "CSPE03", grade: "A", semester: 6, dynamicCredits: 9, dynamicCategory: "PE" },

    // OE (Open Elective) - 12 credits target
    { subjectCode: "CSOE01", grade: "A+", semester: 5, dynamicCredits: 6, dynamicCategory: "OE" },
    { subjectCode: "CSOE02", grade: "O", semester: 6, dynamicCredits: 6, dynamicCategory: "OE" },

    // PW (Project Work) - 32 credits target
    { subjectCode: "CSPW01", grade: "O", semester: 6, dynamicCredits: 6, dynamicCategory: "PW" },
    { subjectCode: "CSPW02", grade: "O", semester: 7, dynamicCredits: 10, dynamicCategory: "PW" },
    { subjectCode: "CSPW03", grade: "O", semester: 8, dynamicCredits: 16, dynamicCategory: "PW" },

    // MNC (Mandatory Non-Credit) - 4 Courses Passed
    { subjectCode: "MNC01", grade: "S", semester: 2 },
    { subjectCode: "MNC02", grade: "S", semester: 4 },
    { subjectCode: "MNC03", grade: "S", semester: 6 },
    { subjectCode: "MNC04", grade: "S", semester: 8 },
  ];

  // Helper function to seed grades for a student
  async function seedGrades(studentId, gradesList) {
    for (const g of gradesList) {
      // Fetch curriculum specifications from SubjectMaster
      let subject = await prisma.subjectMaster.findUnique({
        where: { code: g.subjectCode },
      });

      const creds = g.dynamicCredits !== undefined ? g.dynamicCredits : (subject ? subject.credits : 3.0);
      const cat = g.dynamicCategory ? g.dynamicCategory : (subject ? subject.category : "PC");

      if (!subject) {
        // Auto-create in SubjectMaster
        subject = await prisma.subjectMaster.create({
          data: {
            code: g.subjectCode,
            name: `${g.subjectCode} Subject`,
            credits: creds,
            category: cat,
          },
        });
      }

      const isPassed = PASSING_GRADES.includes(g.grade.toUpperCase());
      const isBacklog = FAILING_GRADES.includes(g.grade.toUpperCase());
      const earned = isPassed ? creds : 0.0;

      await prisma.grade.create({
        data: {
          studentId,
          subjectCode: g.subjectCode,
          subjectName: subject.name,
          credits: creds,
          category: cat,
          semester: g.semester,
          grade: g.grade,
          earned,
          isBacklog,
        },
      });
    }
  }

  // Seed transcripts
  await seedGrades("22ADR001", arjunGrades);
  console.log("Seeded transcripts for Arjun Kumar (22ADR001).");
  
  await seedGrades("22ADR002", bhavanaGrades);
  console.log("Seeded transcripts for Bhavana S (22ADR002).");

  await seedGrades("22ADR003", charanGrades);
  console.log("Seeded transcripts for Charan Tej (22ADR003).");

  await seedGrades("22ADR004", divyaGrades);
  console.log("Seeded transcripts for Divya Sri (22ADR004).");

  // Recalculate CGPA locally
  const studentsList = [
    { roll: "22ADR001", grades: arjunGrades },
    { roll: "22ADR002", grades: bhavanaGrades },
    { roll: "22ADR003", grades: charanGrades },
    { roll: "22ADR004", grades: divyaGrades },
  ];

  for (const s of studentsList) {
    let totalPoints = 0;
    let totalCredits = 0;
    
    // Group by course to find the latest attempt
    const latestAttempts = {};
    for (const g of s.grades) {
      latestAttempts[g.subjectCode] = g;
    }

    for (const code in latestAttempts) {
      const record = latestAttempts[code];
      const subject = await prisma.subjectMaster.findUnique({ where: { code } });
      const cr = record.dynamicCredits !== undefined ? record.dynamicCredits : (subject ? subject.credits : 3.0);
      const cat = record.dynamicCategory ? record.dynamicCategory : (subject ? subject.category : "PC");
      
      if (cat === "MNC") continue; // Exclude MNC from CGPA

      const gp = GRADE_POINTS[record.grade.toUpperCase()] !== undefined ? GRADE_POINTS[record.grade.toUpperCase()] : 0;
      totalPoints += gp * cr;
      totalCredits += cr;
    }

    const calculatedCgpa = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0.0;

    await prisma.student.update({
      where: { rollNumber: s.roll },
      data: { cgpa: calculatedCgpa },
    });
    console.log(`Recalculated CGPA for student ${s.roll}: ${calculatedCgpa}`);
  }

  console.log("Mock data seeding completed successfully!");
}

main()
  .catch(e => {
    console.error("Mock seeding error:", e);
    process.exit(1);
  });
