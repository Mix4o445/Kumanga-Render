import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
  createHmac,
} from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import type { AuthUser, StoredUser } from "@/types";
import { userStore } from "@/lib/db/store";

const COOKIE = "mr_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/* A persistent signing secret. In production (Render) the filesystem is
 * ephemeral, so SESSION_SECRET must be supplied via env. Locally we fall back
 * to a generated file under data/ for zero-config dev. */
function getSecret(): string {
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;

  // Serverless/managed hosts (Vercel, etc.) have a read-only, ephemeral
  // filesystem — never try to write a secret to disk there. Require the env
  // var instead, and fail with a clear, actionable message.
  const isServerless =
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (isServerless) {
    throw new Error(
      "SESSION_SECRET must be set to a string of at least 16 characters in " +
        "production. Set it in your host's environment variables and redeploy.",
    );
  }

  // Local dev only: cache a generated secret on disk for zero-config runs.
  const dir = process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.join(process.cwd(), "data");
  const file = path.join(dir, ".session-secret");
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    fs.mkdirSync(dir, { recursive: true });
    const secret = randomBytes(32).toString("hex");
    fs.writeFileSync(file, secret, { mode: 0o600 });
    return secret;
  }
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function sign(userId: string): string {
  const sig = createHmac("sha256", getSecret()).update(userId).digest("hex");
  return `${userId}.${sig}`;
}

function verifyToken(token: string): string | null {
  const idx = token.lastIndexOf(".");
  if (idx === -1) return null;
  const userId = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = createHmac("sha256", getSecret())
    .update(userId)
    .digest("hex");
  return safeEqualHex(sig, expected) ? userId : null;
}

function toAuthUser(u: StoredUser): AuthUser {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    displayName: u.displayName,
    avatarColor: u.avatarColor,
    avatarImage: u.avatarImage,
    role: u.role,
    verified: u.verified,
  };
}

/* ------------------------------ accounts ------------------------------ */

export async function createUser(
  username: string,
  email: string,
  password: string,
): Promise<AuthUser> {
  const users = await userStore.all();
  const emailLc = email.trim().toLowerCase();
  const nameLc = username.trim().toLowerCase();

  if (users.some((u) => u.email.toLowerCase() === emailLc)) {
    throw new Error("هذا البريد الإلكتروني مُستخدم بالفعل.");
  }
  if (users.some((u) => u.username.toLowerCase() === nameLc)) {
    throw new Error("اسم المستخدم محجوز، اختر اسمًا آخر.");
  }

  const salt = randomBytes(16).toString("hex");
  const user: StoredUser = {
    id: randomUUID(),
    username: username.trim(),
    email: emailLc,
    passwordHash: hashPassword(password, salt),
    salt,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await userStore.save(users);
  return toAuthUser(user);
}

export async function verifyCredentials(
  identifier: string,
  password: string,
): Promise<AuthUser | null> {
  const users = await userStore.all();
  const id = identifier.trim().toLowerCase();
  const user = users.find(
    (u) => u.email.toLowerCase() === id || u.username.toLowerCase() === id,
  );
  if (!user) return null;
  const candidate = hashPassword(password, user.salt);
  return safeEqualHex(candidate, user.passwordHash) ? toAuthUser(user) : null;
}

/* ------------------------------ sessions ------------------------------ */

export function createSession(userId: string): void {
  cookies().set(COOKIE, sign(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function destroySession(): void {
  cookies().delete(COOKIE);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  const userId = verifyToken(token);
  if (!userId) return null;
  const users = await userStore.all();
  const user = users.find((u) => u.id === userId);
  return user ? toAuthUser(user) : null;
}
