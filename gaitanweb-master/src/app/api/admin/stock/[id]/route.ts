import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { handleApiError } from "@/lib/api-errors";

const patchSchema = z.object({
  status: z.enum(["AVAILABLE", "DISABLED"]),
});

/** Reveal one code for a support case — always audit-logged. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const stock = await db.stockItem.findUnique({
      where: { id },
      include: { product: { select: { title: true, subtitle: true } } },
    });
    if (!stock) return NextResponse.json({ error: "ไม่พบรายการสต๊อก" }, { status: 404 });

    await writeAuditLog(admin.id, "stock.reveal", "StockItem", id, { product: stock.product.title });
    return NextResponse.json({ id: stock.id, code: stock.secretData, status: stock.status });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

    const existing = await db.stockItem.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "ไม่พบรายการสต๊อก" }, { status: 404 });
    // SOLD/RESERVED stock is already committed to an order — disabling
    // it after the fact would silently break a delivered order, so
    // only untouched AVAILABLE/DISABLED items can be toggled here.
    if (existing.status === "SOLD" || existing.status === "RESERVED") {
      return NextResponse.json({ error: "ไม่สามารถแก้ไขสต๊อกที่ถูกใช้ไปแล้ว" }, { status: 409 });
    }

    const stock = await db.stockItem.update({ where: { id }, data: { status: parsed.data.status } });
    await writeAuditLog(admin.id, `stock.${parsed.data.status === "DISABLED" ? "disable" : "enable"}`, "StockItem", id);

    return NextResponse.json({ id: stock.id, status: stock.status });
  } catch (err) {
    return handleApiError(err);
  }
}
