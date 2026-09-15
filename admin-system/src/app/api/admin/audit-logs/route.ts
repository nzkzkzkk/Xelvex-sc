import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/security/session";
import { requirePermission } from "@/lib/security/rbac";
import { handleApiError } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    requirePermission(session.role, "audit:read");

    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get("action");
    const targetType = searchParams.get("targetType");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = 30;

    const where = {
      ...(action ? { action: { contains: action, mode: "insensitive" as const } } : {}),
      ...(targetType ? { targetType } : {}),
    };

    const [logs, total] = await Promise.all([
      db.adminAuditLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: { admin: { select: { id: true, username: true, displayName: true, role: true } } },
      }),
      db.adminAuditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        actor: log.admin ? `${log.admin.displayName} (${log.admin.role})` : "System/Anonymous",
        ip: log.ip,
        userAgent: log.userAgent,
        result: log.result,
        metadata: log.metadata,
        createdAt: log.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
