import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/security/session";
import { requirePermission } from "@/lib/security/rbac";
import { verifyPassword } from "@/lib/security/password";
import { decrypt } from "@/lib/security/crypto";
import { logAdminAction } from "@/lib/security/audit";
import { reauthSchema, handleApiError } from "@/lib/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession();
    requirePermission(session.role, "stock:reveal_secret");

    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = reauthSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "กรุณากรอกรหัสผ่านเพื่อยืนยันตัวตนก่อนเปิดเผยข้อมูลสำคัญ" },
        { status: 400 }
      );
    }

    // Verify re-authentication password
    const admin = await db.adminUser.findUnique({ where: { id: session.adminId } });
    if (!admin) {
      return NextResponse.json({ error: "ไม่พบข้อมูลผู้ดูแลระบบ" }, { status: 401 });
    }

    const passwordValid = await verifyPassword(parsed.data.password, admin.passwordHash);
    if (!passwordValid) {
      await logAdminAction({
        adminId: session.adminId,
        action: "STOCK_REVEAL_REAUTH_FAILED",
        targetType: "StockItem",
        targetId: id,
        result: "FAILED",
      });

      return NextResponse.json({ error: "รหัสผ่านยืนยันไม่ถูกต้อง" }, { status: 401 });
    }

    const stockItem = await db.stockItem.findUnique({
      where: { id },
      include: { product: { select: { title: true } } },
    });

    if (!stockItem) {
      return NextResponse.json({ error: "ไม่พบรายการสต็อก" }, { status: 404 });
    }

    // Attempt decryption (handles both encrypted format and legacy demo codes)
    let plainSecret = decrypt(stockItem.secretData);
    if (!plainSecret) {
      // If not in encrypted format, check if legacy string
      plainSecret = stockItem.secretData;
    }

    // Record immutable audit log
    await logAdminAction({
      adminId: session.adminId,
      action: "STOCK_SECRET_REVEALED",
      targetType: "StockItem",
      targetId: id,
      result: "SUCCESS",
      metadata: {
        productTitle: stockItem.product.title,
        status: stockItem.status,
      },
    });

    return NextResponse.json({
      id: stockItem.id,
      productTitle: stockItem.product.title,
      secret: plainSecret,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
