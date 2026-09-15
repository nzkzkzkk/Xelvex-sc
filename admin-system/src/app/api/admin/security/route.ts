import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/security/session";
import { requirePermission } from "@/lib/security/rbac";
import { handleApiError } from "@/lib/validation";

export async function GET() {
  try {
    const session = await requireAdminSession();
    requirePermission(session.role, "security:read");

    const [events, lockedAdmins, totalFailedToday] = await Promise.all([
      db.securityEvent.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
      }),
      db.adminUser.findMany({
        where: { lockedUntil: { gt: new Date() } },
        select: { id: true, username: true, displayName: true, lockedUntil: true, failedLoginAttempts: true },
      }),
      db.adminAuditLog.count({
        where: {
          result: "FAILED",
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return NextResponse.json({
      events: events.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        severity: e.severity,
        ip: e.ip,
        userAgent: e.userAgent,
        details: e.details,
        createdAt: e.createdAt.toISOString(),
      })),
      lockedAdmins: lockedAdmins.map((a) => ({
        id: a.id,
        username: a.username,
        displayName: a.displayName,
        failedLoginAttempts: a.failedLoginAttempts,
        lockedUntil: a.lockedUntil?.toISOString() ?? null,
      })),
      summary: {
        totalFailedToday,
        activeLockouts: lockedAdmins.length,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
