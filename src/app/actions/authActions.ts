"use server";

import prisma from "@/lib/db";
import { setSession, clearSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please enter both email and password." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return { error: "Invalid email or password." };
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { error: "Invalid email or password." };
    }

    // Set AES-256-GCM encrypted HTTP-only session cookie
    await setSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    // Next.js redirect internally throws an error that must not be caught,
    // so we rethrow it if it is a Next.js redirect error
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    // Check for standard next redirect signature
    if (error && typeof error === "object" && "digest" in error && (error as any).digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    
    console.error("Login Server Action Error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }

  // Redirect to dashboard
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
