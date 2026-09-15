import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/security/session";
import { handleApiError } from "@/lib/validation";

export async function GET() {
  try {
    await requireAdminSession();

    const [
      deliveredOrders,
      totalOrders,
      pendingOrders,
      availableStock,
      soldStock,
      pendingApprovals,
      securityAlertsCount,
      recentLogs,
    ] = await Promise.all([
      db.order.findMany({ where: { status: "DELIVERED" }, select: { totalAmount: true } }),
      db.order.count(),
      db.order.count({ where: { status: "PENDING_PAYMENT" } }),
      db.stockItem.count({ where: { status: "AVAILABLE" } }),
      db.stockItem.count({ where: { status: "SOLD" } }),
      db.approvalRequest.count({ where: { status: "PENDING" } }),
      db.securityEvent.count({ where: { severity: "CRITICAL" } }),
      db.adminAuditLog.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: { admin: { select: { username: true, displayName: true } } },
      }),
    ]);

    const totalSales = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    return NextResponse.json({
      stats: {
        totalSales,
        totalOrders,
        pendingOrders,
        availableStock,
        soldStock,
        pendingApprovals,
        securityAlertsCount,
      },
      recentLogs: recentLogs.map((log) => ({
        id: log.id,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        actor: log.admin?.displayName ?? log.admin?.username ?? "System",
        result: log.result,
        createdAt: log.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
