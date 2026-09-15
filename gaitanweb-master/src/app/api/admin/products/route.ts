import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { createProductSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/api-errors";

function slugify(title: string, subtitle?: string) {
  const base = `${title} ${subtitle ?? ""}`
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base}-${Date.now().toString(36)}`;
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => null);
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const game = await db.game.findUnique({ where: { id: parsed.data.gameId } });
    if (!game) return NextResponse.json({ error: "ไม่พบเกมที่เลือก" }, { status: 400 });

    const product = await db.product.create({
      data: {
        gameId: parsed.data.gameId,
        title: parsed.data.title,
        subtitle: parsed.data.subtitle || null,
        category: parsed.data.category || null,
        price: parsed.data.price,
        image: parsed.data.image || null,
        sortOrder: parsed.data.sortOrder ?? 0,
        autoDelivery: parsed.data.autoDelivery,
        slug: slugify(parsed.data.title, parsed.data.subtitle),
      },
    });

    await writeAuditLog(admin.id, "product.create", "Product", product.id, { title: product.title });

    return NextResponse.json({ id: product.id, slug: product.slug });
  } catch (err) {
    return handleApiError(err);
  }
}
