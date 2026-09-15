import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { updateUserSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/api-errors";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    // Never let an admin lock themselves out (suspend or demote self).
    if (id === admin.id) {
      return NextResponse.json({ error: "ไม่สามารถแก้ไขบัญชีของตัวเองได้" }, { status: 400 });
    }

    const target = await db.user.findUnique({ where: { id } });
    if (!target) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });

    const { isActive, role } = parsed.data;
    const user = await db.user.update({
      where: { id },
      data: { ...(isActive !== undefined ? { isActive } : {}), ...(role !== undefined ? { role } : {}) },
    });

    if (isActive !== undefined && isActive !== target.isActive) {
      await writeAuditLog(admin.id, isActive ? "user.activate" : "user.suspend", "User", id, { email: target.email });
    }
    if (role !== undefined && role !== target.role) {
      await writeAuditLog(admin.id, role === "ADMIN" ? "user.promote" : "user.demote", "User", id, {
        email: target.email,
        from: target.role,
        to: role,
      });
    }

    return NextResponse.json({ id: user.id, isActive: user.isActive, role: user.role });
  } catch (err) {
    return handleApiError(err);
  }
}
