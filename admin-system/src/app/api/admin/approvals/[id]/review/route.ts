import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/security/session";
import { requirePermission } from "@/lib/security/rbac";
import { reviewApprovalRequest } from "@/lib/security/dual-control";
import { reviewApprovalSchema, handleApiError } from "@/lib/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession();
    requirePermission(session.role, "approvals:review");

    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = reviewApprovalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "ข้อมูลการพิจารณาไม่ถูกต้อง" }, { status: 400 });
    }

    const result = await reviewApprovalRequest({
      requestId: id,
      reviewerAdminId: session.adminId,
      decision: parsed.data.decision,
      reviewNote: parsed.data.reviewNote,
    });

    return NextResponse.json({
      success: true,
      decision: parsed.data.decision,
      message:
        parsed.data.decision === "APPROVED"
          ? "อนุมัติคำขอเรียบร้อยแล้วและบันทึกประวัติการตรวจสอบอย่างถาวร"
          : "ปฏิเสธคำขอเรียบร้อยแล้ว",
      status: result.request.status,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
