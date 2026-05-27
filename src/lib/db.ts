import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";

  // If using SQLite local file, Prisma 7 requires the driver adapter
  if (dbUrl.startsWith("file:") || dbUrl.endsWith(".db") || dbUrl.includes("dev.db")) {
    try {
      const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

      // Normalize path so relative resolves correctly under both CLI and Next.js App contexts
      let normalizedUrl = dbUrl;
      if (dbUrl === "file:./dev.db") {
        normalizedUrl = "file:./prisma/dev.db";
      }

      const adapter = new PrismaBetterSqlite3({ url: normalizedUrl });
      return new PrismaClient({ adapter });
    } catch (error) {
      console.error("Prisma 7 SQLite Adapter Error, attempting standard Prisma fallback:", error);
      return new PrismaClient();
    }
  } else {
    // Fallback to standard client (e.g., PostgreSQL for Vercel deployment)
    return new PrismaClient();
  }
}

if (process.env.NODE_ENV === "production") {
  prisma = createPrismaClient();
} else {
  // Prevent multiple client instantiations during Next.js dev hot-reloads
  if (!(global as any).prisma) {
    (global as any).prisma = createPrismaClient();
  }
  prisma = (global as any).prisma;
}

export { prisma };
export default prisma;
