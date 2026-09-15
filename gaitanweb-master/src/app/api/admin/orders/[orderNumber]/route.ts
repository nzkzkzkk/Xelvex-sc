import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { fulfillOrder, processPaymentEvent } from "@/lib/payments";
import { orderActionSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/api-errors";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ orderNumber: string }> }) {
  try {
    const admin = await requireAdmin();
    const { orderNumber } = await params;
    const body = await req.json().catch(() => null);
    const parsed = orderActionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

    const order = await db.order.findUnique({ where: { orderNumber } });
    if (!order) return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });

    const { action } = parsed.data;
    const from = order.status;

    switch (action) {
      case "cancel": {
        if (from !== "PENDING_PAYMENT" && from !== "FAILED") {
          return NextResponse.json({ error: "ยกเลิกได้เฉพาะออเดอร์ที่ยังไม่ชำระเงิน" }, { status: 409 });
        }
        await db.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
        await writeAuditLog(admin.id, "order.cancel", "Order", order.id, { orderNumber, from });
        return NextResponse.json({ status: "CANCELLED" });
      }

      case "mark_paid": {
        if (from !== "PENDING_PAYMENT") {
          return NextResponse.json({ error: "ออเดอร์นี้ไม่ได้อยู่ในสถานะรอชำระเงิน" }, { status: 409 });
        }
        // Goes through the same path as a real gateway webhook so stock
        // assignment / idempotency behave identically.
        const result = await processPaymentEvent({
          orderNumber,
          transactionId: `MANUAL-${orderNumber}-${Date.now()}`,
          provider: "manual-admin",
          amount: order.totalAmount,
          status: "SUCCESS",
        });
        if (!result.ok) return NextResponse.json({ error: result.error ?? "ไม่สำเร็จ" }, { status: 409 });
        await writeAuditLog(admin.id, "order.mark_paid", "Order", order.id, { orderNumber, to: result.orderStatus });
        return NextResponse.json({ status: result.orderStatus });
      }

      case "retry_delivery": {
        if (from !== "PROCESSING" && from !== "PAID") {
          return NextResponse.json({ error: "ออเดอร์นี้ไม่มีรายการที่รอจัดส่ง" }, { status: 409 });
        }
        const status = await fulfillOrder(order.id);
        await writeAuditLog(admin.id, "order.retry_delivery", "Order", order.id, { orderNumber, to: status });
        return NextResponse.json({ status });
      }

      case "refund": {
        if (from !== "PAID" && from !== "PROCESSING" && from !== "DELIVERED") {
          return NextResponse.json({ error: "คืนเงินได้เฉพาะออเดอร์ที่ชำระเงินแล้ว" }, { status: 409 });
        }
        // Codes already revealed to the customer are burned — they stay
        // SOLD and are never put back on sale.
        await db.$transaction([
          db.order.update({ where: { id: order.id }, data: { status: "REFUNDED" } }),
          db.payment.updateMany({ where: { orderId: order.id, status: "SUCCESS" }, data: { status: "REFUNDED" } }),
        ]);
        await writeAuditLog(admin.id, "order.refund", "Order", order.id, { orderNumber, from, amount: order.totalAmount });
        return NextResponse.json({ status: "REFUNDED" });
      }
    }
  } catch (err) {
    return handleApiError(err);
  }
}
