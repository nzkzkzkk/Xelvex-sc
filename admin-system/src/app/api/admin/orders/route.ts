import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/security/session";
import { requirePermission } from "@/lib/security/rbac";
import { logAdminAction } from "@/lib/security/audit";
import { handleApiError } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    requirePermission(session.role, "orders:read");

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = 20;

    const where = status ? { status } : {};

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { email: true, displayName: true } },
          orderItems: { include: { product: { select: { title: true } } } },
        },
      }),
      db.order.count({ where }),
    ]);

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerEmail: o.user.email,
        customerName: o.user.displayName,
        totalAmount: o.totalAmount,
        status: o.status,
        paymentMethod: o.paymentMethod,
        items: o.orderItems.map((item) => ({
          id: item.id,
          title: item.product.title,
          unitPrice: item.unitPrice,
        })),
        createdAt: o.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
