import "server-only";
import { db } from "@/lib/db";

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitBucket>();

export interface RateLimitCheck {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * In-memory sliding rate limiter per key.
 */
export function checkRateLimit(key: string, maxAttempts: number, windowSeconds: number): RateLimitCheck {
  const now = Date.now();
  const bucket = memoryStore.get(key);

  if (!bucket || bucket.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: maxAttempts - 1, retryAfterSeconds: 0 };
  }

  if (bucket.count >= maxAttempts) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds: Math.max(1, retryAfter) };
  }

  bucket.count += 1;
  return { allowed: true, remaining: maxAttempts - bucket.count, retryAfterSeconds: 0 };
}

export function resetRateLimit(key: string): void {
  memoryStore.delete(key);
}

const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MINUTES = 15;

/**
 * Record a failed login attempt on the admin account.
 * Triggers progressive lockout after 5 consecutive failures.
 */
export async function handleFailedLoginAttempt(adminId: string, ip: string, userAgent: string): Promise<{ locked: boolean; lockExpires?: Date }> {
  const admin = await db.adminUser.findUnique({ where: { id: adminId } });
  if (!admin) return { locked: false };

  const attempts = admin.failedLoginAttempts + 1;
  const shouldLock = attempts >= MAX_FAILED_LOGINS;
  const lockedUntil = shouldLock ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null;

  await db.adminUser.update({
    where: { id: adminId },
    data: {
      failedLoginAttempts: attempts,
      lockedUntil,
    },
  });

  if (shouldLock) {
    // Record security event
    await db.securityEvent.create({
      data: {
        eventType: "ADMIN_ACCOUNT_LOCKED",
        severity: "CRITICAL",
        ip,
        userAgent,
        details: JSON.stringify({
          adminId,
          username: admin.username,
          consecutiveFailures: attempts,
          lockedUntil,
        }),
      },
    });
  }

  return { locked: shouldLock, lockExpires: lockedUntil ?? undefined };
}

/**
 * Reset failed login counter upon successful authentication.
 */
export async function resetFailedLoginAttempts(adminId: string): Promise<void> {
  await db.adminUser.update({
    where: { id: adminId },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });
}
