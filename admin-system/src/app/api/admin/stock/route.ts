import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/security/session";
import { requirePermission } from "@/lib/security/rbac";
import { encrypt, maskSecret } from "@/lib/security/crypto";
import { logAdminAction } from "@/lib/security/audit";
import { addStockSchema, handleApiError } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    requirePermission(session.role, "stock:read");

    const searchParams = req.nextUrl.searchParams;
    const productId = searchParams.get("productId");
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = 20;

    const where = {
      ...(productId ? { productId } : {}),
      ...(status ? { status } : {}),
    };

    const [items, total, products] = await Promise.all([
      db.stockItem.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: { product: { select: { title: true, game: { select: { name: true } } } } },
      }),
      db.stockItem.count({ where }),
      db.product.findMany({ select: { id: true, title: true } }),
    ]);

    return NextResponse.json({
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productTitle: item.product.title,
        gameName: item.product.game.name,
        maskedSecret: maskSecret(item.secretData), // Never return raw plaintext!
        status: item.status,
        createdAt: item.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / pageSize),
      products,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    requirePermission(session.role, "stock:write");

    const body = await req.json().catch(() => null);
    const parsed = addStockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "ข้อมูลสต็อกไม่ถูกต้อง" }, { status: 400 });
    }

    const { productId, items } = parsed.data;

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "ไม่พบสินค้าดังกล่าว" }, { status: 404 });
    }

    // Encrypt each stock item with AES-256-GCM before database insertion
    const encryptedData = items.map((rawCode) => ({
      productId,
      secretData: encrypt(rawCode),
      status: "AVAILABLE",
    }));

    const result = await db.stockItem.createMany({
      data: encryptedData,
    });

    await logAdminAction({
      adminId: session.adminId,
      action: "STOCK_ADDED",
      targetType: "Product",
      targetId: productId,
      metadata: {
        count: result.count,
        productTitle: product.title,
      },
    });

    return NextResponse.json({
      success: true,
      addedCount: result.count,
      message: `เพิ่มสต็อกจำนวน ${result.count} รายการ (เข้ารหัส AES-256-GCM สำเร็จ)`,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
