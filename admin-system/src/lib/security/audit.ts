import "server-only";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { extractClientInfo } from "./session";
import type { SecuritySeverity } from "@prisma/client";

// Never log sensitive fields in audit metadata
const SENSITIVE_KEYS = new Set([
  "password",
  "passwordHash",
  "secret",
  "secretData",
  "rawSecret",
  "totpSecret",
  "code",
  "token",
  "authTag",
]);

function sanitizeMetadata(data: unknown): string | null {
  if (!data) return null;
  if (typeof data !== "object") return String(data);

  try {
    const cleaned = JSON.parse(
      JSON.stringify(data, (key, value) => {
        if (SENSITIVE_KEYS.has(key)) {
          return "[REDACTED]";
        }
        return value;
      })
    );
    return JSON.stringify(cleaned);
  } catch {
    return "[SERIALIZATION_ERROR]";
  }
}

export async function logAdminAction(params: {
  adminId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  result?: "SUCCESS" | "FAILED";
  metadata?: unknown;
}): Promise<void> {
  try {
    const headerStore = await headers();
    const { ip, userAgent } = extractClientInfo(headerStore);

    await db.adminAuditLog.create({
      data: {
        adminId: params.adminId ?? null,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId ?? null,
        ip,
        userAgent,
        result: params.result ?? "SUCCESS",
        metadata: sanitizeMetadata(params.metadata),
      },
    });
  } catch (error) {
    // Audit logging should never crash the main application, but should alert in console
    console.error("[AUDIT_LOG_ERROR] Failed to record admin audit log:", error);
  }
}

export async function logSecurityEvent(params: {
  eventType: string;
  severity?: SecuritySeverity;
  details?: unknown;
}): Promise<void> {
  try {
    const headerStore = await headers();
    const { ip, userAgent } = extractClientInfo(headerStore);

    await db.securityEvent.create({
      data: {
        eventType: params.eventType,
        severity: params.severity ?? "WARNING",
        ip,
        userAgent,
        details: sanitizeMetadata(params.details),
      },
    });
  } catch (error) {
    console.error("[SECURITY_EVENT_ERROR] Failed to record security event:", error);
  }
}
