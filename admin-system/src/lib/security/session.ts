import "server-only";
import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import type { AdminRole } from "@prisma/client";

export const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60; // 12 hours maximum
const IDLE_TIMEOUT_SECONDS = 30 * 60; // 30 minutes idle timeout

export interface ActiveAdminSession {
  sessionId: string;
  adminId: string;
  username: string;
  email: string;
  displayName: string;
  role: AdminRole;
  ipAddress?: string | null;
  userAgent?: string | null;
}

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function extractClientInfo(headersList: Headers): { ip: string; userAgent: string } {
  const forwarded = headersList.get("cf-connecting-ip") || headersList.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : headersList.get("x-real-ip") ?? "127.0.0.1";
  const userAgent = headersList.get("user-agent") ?? "Unknown";
  return { ip, userAgent };
}

/**
 * Create a new cryptographic admin session, record in DB, and attach Secure Cookie.
 */
export async function createAdminSession(adminId: string): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  const headerStore = await headers();
  const { ip, userAgent } = extractClientInfo(headerStore);

  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  // Insert session record
  await db.adminSession.create({
    data: {
      adminId,
      tokenHash,
      ipAddress: ip,
      userAgent,
      expiresAt,
    },
  });

  // Set hardened cookie
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return rawToken;
}

/**
 * Read and validate current admin session.
 * Checks expiry, idle timeout, revoked status, and active admin account.
 */
export async function getAdminSession(): Promise<ActiveAdminSession | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!rawToken || rawToken.length < 32) return null;

  const tokenHash = hashToken(rawToken);
  const now = new Date();

  const session = await db.adminSession.findUnique({
    where: { tokenHash },
    include: { admin: true },
  });

  if (!session || session.revokedAt !== null) return null;
  if (session.expiresAt < now) return null;

  // Check idle timeout
  const idleThreshold = new Date(now.getTime() - IDLE_TIMEOUT_SECONDS * 1000);
  if (session.lastActivityAt < idleThreshold) {
    // Session expired due to inactivity
    await db.adminSession.update({
      where: { id: session.id },
      data: { revokedAt: now },
    });
    return null;
  }

  // Ensure admin account is active and not locked
  const admin = session.admin;
  if (!admin || !admin.isActive) return null;
  if (admin.lockedUntil && admin.lockedUntil > now) return null;

  // Update last activity periodically (every 2 mins at most to save DB writes)
  if (now.getTime() - session.lastActivityAt.getTime() > 120_000) {
    await db.adminSession.update({
      where: { id: session.id },
      data: { lastActivityAt: now },
    });
  }

  return {
    sessionId: session.id,
    adminId: admin.id,
    username: admin.username,
    email: admin.email,
    displayName: admin.displayName,
    role: admin.role,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
  };
}

/**
 * Invalidate current session and clear cookie.
 */
export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (rawToken) {
    const tokenHash = hashToken(rawToken);
    await db.adminSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

/**
 * Invalidate all active sessions for a specific admin (e.g. after password change or logout all devices).
 */
export async function revokeAllAdminSessions(adminId: string): Promise<void> {
  await db.adminSession.updateMany({
    where: { adminId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Authentication guard for Admin API endpoints.
 * Throws 401 response error if not authenticated.
 */
export async function requireAdminSession(): Promise<ActiveAdminSession> {
  const session = await getAdminSession();
  if (!session) {
    const error = new Error("UNAUTHENTICATED") as Error & { status: number };
    error.status = 401;
    throw error;
  }
  return session;
}
