import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { addStockSchema, bulkStockSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/api-errors";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => null);
    const parsed = addStockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const product = await db.product.findUnique({ where: { id: parsed.data.productId } });
    if (!product) return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 400 });

    // Skip codes this product already holds so a re-pasted file can't
    // double-load the same key.
    const existing = await db.stockItem.findMany({
      where: { productId: product.id, secretData: { in: parsed.data.codes } },
      select: { secretData: true },
    });
    const dupes = new Set(existing.map((s) => s.secretData));
    const fresh = Array.from(new Set(parsed.data.codes)).filter((c) => !dupes.has(c));

    // Demo storage: codes go in as-is. A real deployment must encrypt
    // each one at the application layer before this write.
    const result = fresh.length
      ? await db.stockItem.createMany({
          data: fresh.map((code) => ({ productId: product.id, secretData: code, status: "AVAILABLE" })),
        })
      : { count: 0 };

    await writeAuditLog(admin.id, "stock.add", "Product", product.id, {
      count: result.count,
      skippedDuplicates: parsed.data.codes.length - fresh.length,
    });

    return NextResponse.json({ added: result.count, skipped: parsed.data.codes.length - fresh.length });
  } catch (err) {
    return handleApiError(err);
  }
}

/** Bulk enable/disable. SOLD/RESERVED rows are silently skipped — they belong to an order. */
export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => null);
    const parsed = bulkStockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const { ids, status } = parsed.data;
    const result = await db.stockItem.updateMany({
      where: { id: { in: ids }, status: { in: ["AVAILABLE", "DISABLED"] } },
      data: { status },
    });
    await writeAuditLog(admin.id, status === "DISABLED" ? "stock.bulk_disable" : "stock.bulk_enable", "StockItem", "bulk", {
      count: result.count,
      requested: ids.length,
    });

    return NextResponse.json({ updated: result.count, skipped: ids.length - result.count });
  } catch (err) {
    return handleApiError(err);
  }
}
