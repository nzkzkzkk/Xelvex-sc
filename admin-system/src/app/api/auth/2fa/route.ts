import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loginStep2TotpSchema, handleApiError } from "@/lib/validation";
import { verifyTotpCode, generateRecoveryCodes } from "@/lib/security/totp";
import { decrypt } from "@/lib/security/crypto";
import { createAdminSession, extractClientInfo } from "@/lib/security/session";
import { resetFailedLoginAttempts } from "@/lib/security/rate-limiter";
import { logAdminAction, logSecurityEvent } from "@/lib/security/audit";

export async function POST(req: NextRequest) {
  try {
    const { ip, userAgent } = extractClientInfo(req.headers);
    const body = await req.json().catch(() => null);
    const parsed = loginStep2TotpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "รหัส 2FA ไม่ถูกต้อง กรุณากรอกตัวเลข 6 หลัก" }, { status: 400 });
    }

    const { adminId, totpCode } = parsed.data;

    const admin = await db.adminUser.findUnique({
      where: { id: adminId },
      include: { totp: true },
    });

    if (!admin || !admin.isActive || !admin.totp) {
      return NextResponse.json({ error: "ไม่พบข้อมูลการยืนยันตัวตน 2FA" }, { status: 401 });
    }

    // Decrypt the TOTP secret stored in DB
    const secretBase32 = decrypt(admin.totp.secretEncrypted);
    if (!secretBase32) {
      return NextResponse.json({ error: "เกิดข้อผิดพลาดในการตรวจสอบ 2FA Secret" }, { status: 500 });
    }

    // Verify 6-digit TOTP code
    const isValid = verifyTotpCode(secretBase32, totpCode);
    if (!isValid) {
      await logSecurityEvent({
        eventType: "INVALID_TOTP_CODE",
        severity: "WARNING",
        details: { adminId, ip },
      });

      await logAdminAction({
        adminId,
        action: "2FA_VERIFICATION_FAILED",
        targetType: "AdminUser",
        targetId: adminId,
        result: "FAILED",
        metadata: { ip },
      });

      return NextResponse.json({ error: "รหัส 2FA ไม่ถูกต้องหรือหมดอายุ กรุณาลองใหม่อีกครั้ง" }, { status: 401 });
    }

    let backupCodesList: string[] | undefined = undefined;

    // If this is first-time setup confirmation, activate TOTP and issue recovery backup codes
    if (!admin.totp.isVerified) {
      const { plainCodes, hashedCodes } = generateRecoveryCodes();
      backupCodesList = plainCodes;

      await db.$transaction(async (tx) => {
        await tx.adminTotp.update({
          where: { adminId },
          data: { isVerified: true },
        });

        // Store hashed recovery codes
        await tx.adminRecoveryCode.createMany({
          data: hashedCodes.map((codeHash) => ({
            adminId,
            codeHash,
          })),
        });
      });
    }

    // Authentication completely successful: reset failed counters & create session
    await resetFailedLoginAttempts(admin.id);
    await createAdminSession(admin.id);

    await logAdminAction({
      adminId: admin.id,
      action: "LOGIN_2FA_SUCCESS",
      targetType: "AdminUser",
      targetId: admin.id,
      result: "SUCCESS",
      metadata: { ip, userAgent, role: admin.role },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        displayName: admin.displayName,
        role: admin.role,
      },
      backupCodes: backupCodesList, // Provided only upon first-time enrollment
    });
  } catch (err) {
    return handleApiError(err);
  }
}
