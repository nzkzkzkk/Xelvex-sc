import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/security/session";
import { requirePermission } from "@/lib/security/rbac";
import { hashPassword, validatePasswordStrength } from "@/lib/security/password";
import { createApprovalRequest } from "@/lib/security/dual-control";
import { logAdminAction } from "@/lib/security/audit";
import { inviteAdminSchema, handleApiError } from "@/lib/validation";

export async function GET() {
  try {
    const session = await requireAdminSession();
    requirePermission(session.role, "admins:read");

    const admins = await db.adminUser.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        lastLoginAt: true,
        createdAt: true,
        totp: { select: { isVerified: true } },
      },
    });

    return NextResponse.json({
      admins: admins.map((a) => ({
        id: a.id,
        username: a.username,
        email: a.email,
        displayName: a.displayName,
        role: a.role,
        isActive: a.isActive,
        is2FAEnrolled: a.totp?.isVerified ?? false,
        lastLoginAt: a.lastLoginAt?.toISOString() ?? null,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    requirePermission(session.role, "admins:write");

    const body = await req.json().catch(() => null);
    const parsed = inviteAdminSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const { username, email, displayName, role, password } = parsed.data;

    // Validate password strength
    const strengthCheck = validatePasswordStrength(password);
    if (!strengthCheck.valid) {
      return NextResponse.json({ error: strengthCheck.errors.join(", ") }, { status: 400 });
    }

    // Check unique username and email
    const existing = await db.adminUser.findFirst({
      where: {
        OR: [
          { username: { equals: username, mode: "insensitive" } },
          { email: { equals: email, mode: "insensitive" } },
        ],
      },
    });

    if (existing) {
      return NextResponse.json({ error: "ชื่อผู้ใช้หรืออีเมลนี้มีอยู่ในระบบแล้ว" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    // DUAL-CONTROL REQUIREMENT: Creating or promoting a SUPER_ADMIN requires Dual-Control approval!
    if (role === "SUPER_ADMIN") {
      const approval = await createApprovalRequest({
        actionType: "CREATE_SUPER_ADMIN",
        title: `สร้างผู้ดูแลระบบสูงสุด (SUPER_ADMIN): ${username}`,
        description: `ขออนุมัติสร้างบัญชี ${displayName} (${email}) ในตำแหน่ง SUPER_ADMIN`,
        payload: {
          username,
          email,
          displayName,
          role,
          passwordHash,
        },
        requestedByAdminId: session.adminId,
      });

      return NextResponse.json({
        success: true,
        requiresApproval: true,
        approvalId: approval.id,
        message: "การแต่งตั้ง SUPER_ADMIN จำเป็นต้องผ่านการอนุมัติแบบ Dual-Control โดยแอดมินอีกท่านหนึ่ง ระบบได้ส่งคำขออนุมัติแล้ว",
      });
    }

    // Standard admin creation
    const newAdmin = await db.adminUser.create({
      data: {
        username,
        email,
        displayName,
        role,
        passwordHash,
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
      },
    });

    await logAdminAction({
      adminId: session.adminId,
      action: "ADMIN_USER_CREATED",
      targetType: "AdminUser",
      targetId: newAdmin.id,
      metadata: { username, role, email },
    });

    return NextResponse.json({
      success: true,
      admin: newAdmin,
      message: `สร้างบัญชีแอดมิน ${username} (${role}) สำเร็จ`,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
