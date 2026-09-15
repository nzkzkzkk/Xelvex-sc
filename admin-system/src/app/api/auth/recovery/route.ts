import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loginRecoverySchema, handleApiError } from "@/lib/validation";
import { hashRecoveryCode } from "@/lib/security/totp";
import { createAdminSession, extractClientInfo } from "@/lib/security/session";
import { logAdminAction, logSecurityEvent } from "@/lib/security/audit";

export async function POST(req: NextRequest) {
  try {
    const { ip } = extractClientInfo(req.headers);
    const body = await req.json().catch(() => null);
    const parsed = loginRecoverySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "รหัสกู้คืนไม่ถูกต้อง" }, { status: 400 });
    }

    const { adminId, recoveryCode } = parsed.data;
    const codeHash = hashRecoveryCode(recoveryCode);

    const record = await db.adminRecoveryCode.findFirst({
      where: {
        adminId,
        codeHash,
        usedAt: null,
      },
      include: { admin: true },
    });

    if (!record || !record.admin.isActive) {
      await logSecurityEvent({
        eventType: "INVALID_RECOVERY_CODE_ATTEMPT",
        severity: "CRITICAL",
        details: { adminId, ip },
      });

      return NextResponse.json({ error: "รหัสกู้คืนไม่ถูกต้องหรือถูกใช้งานไปแล้ว" }, { status: 401 });
    }

    // Mark recovery code as consumed
    await db.adminRecoveryCode.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    // Issue new session
    await createAdminSession(adminId);

    await logAdminAction({
      adminId,
      action: "LOGIN_RECOVERY_CODE_USED",
      targetType: "AdminRecoveryCode",
      targetId: record.id,
      metadata: { ip },
    });

    return NextResponse.json({
      success: true,
      message: "เข้าสู่ระบบด้วยรหัสกู้คืนสำเร็จ แนะนำให้ตั้งค่า 2FA ใหม่ในหน้าตั้งค่า",
      user: {
        id: record.admin.id,
        username: record.admin.username,
        email: record.admin.email,
        displayName: record.admin.displayName,
        role: record.admin.role,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
