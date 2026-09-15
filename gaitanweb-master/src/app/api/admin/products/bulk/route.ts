import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { bulkProductSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/api-errors";

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => null);
    const parsed = bulkProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const { ids, isActive } = parsed.data;
    const result = await db.product.updateMany({ where: { id: { in: ids } }, data: { isActive } });
    await writeAuditLog(admin.id, isActive ? "product.bulk_enable" : "product.bulk_disable", "Product", "bulk", {
      count: result.count,
      ids,
    });

    return NextResponse.json({ updated: result.count });
  } catch (err) {
    return handleApiError(err);
  }
}
