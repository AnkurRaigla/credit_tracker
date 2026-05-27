const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const bcrypt = require("bcryptjs");

// Instantiate adapter by passing options object with 'url'
const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding B.Tech Tracker database...");

  // Delete all existing users
  await prisma.user.deleteMany();
  console.log("Cleared existing users.");

  // Hash passwords
  const adminHash = await bcrypt.hash("adminpassword", 10);
  const advisorHash = await bcrypt.hash("advisorpassword", 10);

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      email: "admin@btechtracker.edu",
      name: "System Administrator",
      password: adminHash,
      role: "ADMIN",
    },
  });
  console.log("Created Admin account: " + admin.email + " (pwd: adminpassword)");

  // Create Advisor
  const advisor = await prisma.user.create({
    data: {
      email: "advisor@btechtracker.edu",
      name: "Class Advisor",
      password: advisorHash,
      role: "ADVISOR",
    },
  });
  console.log("Created Advisor account: " + advisor.email + " (pwd: advisorpassword)");

  // Seed a sample SubjectMaster table for testing category tracking
  await prisma.subjectMaster.deleteMany();
  console.log("Cleared existing subjects.");

  const defaultSubjects = [
    { code: "HS101", name: "Communicative English", credits: 3, category: "HS" },
    { code: "HS201", name: "Universal Human Values", credits: 3, category: "HS" },
    { code: "BS101", name: "Engineering Mathematics I", credits: 4, category: "BS" },
    { code: "BS102", name: "Engineering Physics", credits: 4, category: "BS" },
    { code: "BS103", name: "Engineering Chemistry", credits: 4, category: "BS" },
    { code: "ES101", name: "Programming in C", credits: 4, category: "ES" },
    { code: "ES102", name: "Basic Electrical Engineering", credits: 4, category: "ES" },
    { code: "ES103", name: "Engineering Graphics", credits: 3, category: "ES" },
    { code: "CS101", name: "Data Structures", credits: 4, category: "PC" },
    { code: "CS102", name: "Computer Organization & Architecture", credits: 4, category: "PC" },
    { code: "CS201", name: "Design & Analysis of Algorithms", credits: 4, category: "PC" },
    { code: "CS202", name: "Operating Systems", credits: 4, category: "PC" },
    { code: "CS203", name: "Database Management Systems", credits: 4, category: "PC" },
    { code: "CS301", name: "Software Engineering", credits: 4, category: "PC" },
    { code: "CSPE01", name: "Artificial Intelligence", credits: 3, category: "PE" },
    { code: "CSPE02", name: "Cloud Computing", credits: 3, category: "PE" },
    { code: "CSOE01", name: "Introduction to Internet of Things", credits: 3, category: "OE" },
    { code: "CSOE02", name: "Cybersecurity Fundamentals", credits: 3, category: "OE" },
    { code: "CSPW01", name: "Mini Project", credits: 6, category: "PW" },
    { code: "CSPW02", name: "Capstone Project Phase I", credits: 10, category: "PW" },
    { code: "CSPW03", name: "Capstone Project Phase II", credits: 16, category: "PW" },
    { code: "MNC01", name: "Environmental Sciences", credits: 0, category: "MNC" },
    { code: "MNC02", name: "Constitution of India", credits: 0, category: "MNC" },
    { code: "MNC03", name: "Essence of Indian Traditional Knowledge", credits: 0, category: "MNC" },
    { code: "MNC04", name: "Intellectual Property Rights", credits: 0, category: "MNC" },
  ];

  for (const sub of defaultSubjects) {
    await prisma.subjectMaster.create({ data: sub });
  }
  console.log("Seeded " + defaultSubjects.length + " default subjects in SubjectMaster.");
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  });
