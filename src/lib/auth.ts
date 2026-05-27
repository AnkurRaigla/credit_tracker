import { cookies } from "next/headers";
import crypto from "crypto";

const SECRET = process.env.NEXTAUTH_SECRET || "default_auth_secret_must_be_32_bytes_or_longer_for_aes_256_gcm";
const ALGORITHM = "aes-256-gcm";
// Create a 32-byte key derived from the secret
const KEY = crypto.scryptSync(SECRET, "academic-tracker-salt", 32);

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${encrypted}:${authTag}`;
}

export function decrypt(text: string): string {
  const parts = text.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid session token format");
  }
  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1]; // Keep as raw hex string to match decipher string overload
  const authTag = Buffer.from(parts[2], "hex");
  
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;
    if (!sessionToken) return null;
    
    const decrypted = decrypt(sessionToken);
    return JSON.parse(decrypted) as {
      id: string;
      email: string;
      name: string;
      role: "ADMIN" | "ADVISOR";
    };
  } catch (error) {
    return null;
  }
}

export async function setSession(payload: {
  id: string;
  email: string;
  name: string;
  role: string;
}) {
  const encrypted = encrypt(JSON.stringify(payload));
  const cookieStore = await cookies();
  cookieStore.set("session", encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set("session", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
  });
}
