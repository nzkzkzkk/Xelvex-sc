import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/security/session";
import { requirePermission } from "@/lib/security/rbac";
import { createApprovalRequest } from "@/lib/security/dual-control";
import { createApprovalSchema, handleApiError } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    const status = req.nextUrl.searchParams.get("status");

    const where = status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" } : {};

    const requests = await db.approvalRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        requestedBy: { select: { id: true, username: true, displayName: true, role: true } },
        reviewedBy: { select: { id: true, username: true, displayName: true, role: true } },
      },
    });

    return NextResponse.json({
      requests: requests.map((r) => ({
        id: r.id,
        actionType: r.actionType,
        title: r.title,
        description: r.description,
        status: r.status,
        requestedBy: r.requestedBy,
        reviewedBy: r.reviewedBy,
        reviewNote: r.reviewNote,
        canReview: r.requestedByAdminId !== session.adminId && r.status === "PENDING",
        executedAt: r.executedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    requirePermission(session.role, "approvals:request");

    const body = await req.json().catch(() => null);
    const parsed = createApprovalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "ข้อมูลคำขออนุมัติไม่ถูกต้อง" }, { status: 400 });
    }

    const created = await createApprovalRequest({
      actionType: parsed.data.actionType,
      title: parsed.data.title,
      description: parsed.data.description,
      payload: parsed.data.payload,
      requestedByAdminId: session.adminId,
    });

    return NextResponse.json({
      success: true,
      requestId: created.id,
      message: "สร้างคำขออนุมัติเรียบร้อยแล้ว (รอผู้ดูแลระบบท่านอื่นเป็นผู้อนุมัติ)",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
