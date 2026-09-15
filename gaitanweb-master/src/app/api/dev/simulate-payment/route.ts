import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { processPaymentEvent } from "@/lib/payments";

const bodySchema = z.object({
  orderNumber: z.string().min(1),
  outcome: z.enum(["SUCCESS", "FAILED"]).default("SUCCESS"),
});

/**
 * Stand-in for a real payment gateway. No real TrueMoney/PromptPay/
 * card integration exists yet (see the earlier conversation on legal
 * gift-card resale — that requires an actual distributor agreement
 * before any payment provider is wired up). This lets the checkout
 * flow be tested end-to-end today by calling the exact same
 * `processPaymentEvent` path a real gateway webhook would hit.
 *
 * Delete this route once a real gateway webhook is live.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    const { orderNumber, outcome } = parsed.data;
    const order = await db.order.findUnique({ where: { orderNumber } });
    if (!order || (order.userId !== user.id && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
    }

    const result = await processPaymentEvent({
      orderNumber,
      transactionId: `SIM-${orderNumber}-${Date.now()}`,
      provider: "dev-simulator",
      amount: order.totalAmount,
      status: outcome,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }
    return NextResponse.json(result);
  } catch (err) {
    const status = typeof err === "object" && err !== null && "status" in err ? Number(err.status) : 500;
    if (status === 401) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดของระบบ" }, { status: 500 });
  }
}
