import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const user = await requireUser();
    const { orderNumber } = await params;

    const order = await db.order.findUnique({
      where: { orderNumber },
      include: { orderItems: { include: { product: true } } },
    });

    // Ownership check — an order that exists but belongs to someone
    // else must look identical to one that doesn't exist at all.
    if (!order || (order.userId !== user.id && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
    }

    // Each OrderItem row is one unit (so it can hold exactly one
    // StockItem) — group back by product for a compact display.
    const grouped = new Map<string, { title: string; subtitle: string | null; unitPrice: number; quantity: number }>();
    for (const i of order.orderItems) {
      const key = `${i.productId}:${i.unitPrice}`;
      const existing = grouped.get(key);
      if (existing) existing.quantity += 1;
      else grouped.set(key, { title: i.product.title, subtitle: i.product.subtitle, unitPrice: i.unitPrice, quantity: 1 });
    }

    return NextResponse.json({
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt.toISOString(),
      items: Array.from(grouped.values()),
    });
  } catch (err) {
    const status = typeof err === "object" && err !== null && "status" in err ? Number(err.status) : 500;
    if (status === 401) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดของระบบ" }, { status: 500 });
  }
}
