import "server-only";
import { db } from "@/lib/db";
import { encrypt, decrypt } from "./crypto";
import { logAdminAction, logSecurityEvent } from "./audit";

export interface CreateApprovalParams {
  actionType: string;
  title: string;
  description?: string;
  payload: Record<string, unknown>;
  requestedByAdminId: string;
}

/**
 * Submit a high-risk action for Dual-Control approval.
 */
export async function createApprovalRequest(params: CreateApprovalParams) {
  const payloadEncrypted = encrypt(JSON.stringify(params.payload));

  const request = await db.approvalRequest.create({
    data: {
      actionType: params.actionType,
      title: params.title,
      description: params.description,
      payloadEncrypted,
      status: "PENDING",
      requestedByAdminId: params.requestedByAdminId,
    },
  });

  await logAdminAction({
    adminId: params.requestedByAdminId,
    action: "APPROVAL_REQUEST_CREATED",
    targetType: "ApprovalRequest",
    targetId: request.id,
    metadata: {
      actionType: params.actionType,
      title: params.title,
    },
  });

  return request;
}

/**
 * Review an existing approval request (APPROVE or REJECT).
 * Enforces strict Two-Person Rule: Requester CANNOT review/approve their own request!
 */
export async function reviewApprovalRequest(params: {
  requestId: string;
  reviewerAdminId: string;
  decision: "APPROVED" | "REJECTED";
  reviewNote?: string;
}) {
  const request = await db.approvalRequest.findUnique({
    where: { id: params.requestId },
  });

  if (!request) {
    const error = new Error("Approval request not found") as Error & { status: number };
    error.status = 404;
    throw error;
  }

  if (request.status !== "PENDING") {
    const error = new Error(`Request has already been ${request.status.toLowerCase()}`) as Error & { status: number };
    error.status = 400;
    throw error;
  }

  // CRITICAL SECURITY CONSTRAINT: Self-approval is strictly forbidden!
  if (request.requestedByAdminId === params.reviewerAdminId) {
    await logSecurityEvent({
      eventType: "DUAL_CONTROL_SELF_APPROVAL_ATTEMPT",
      severity: "CRITICAL",
      details: {
        requestId: params.requestId,
        adminId: params.reviewerAdminId,
        actionType: request.actionType,
      },
    });

    const error = new Error("FORBIDDEN: Dual-control mandates approval by a distinct administrator. You cannot approve your own request.") as Error & { status: number };
    error.status = 403;
    throw error;
  }

  const updated = await db.approvalRequest.update({
    where: { id: params.requestId },
    data: {
      status: params.decision,
      reviewedByAdminId: params.reviewerAdminId,
      reviewNote: params.reviewNote,
      executedAt: params.decision === "APPROVED" ? new Date() : null,
    },
  });

  await logAdminAction({
    adminId: params.reviewerAdminId,
    action: `APPROVAL_REQUEST_${params.decision}`,
    targetType: "ApprovalRequest",
    targetId: request.id,
    metadata: {
      actionType: request.actionType,
      decision: params.decision,
      reviewNote: params.reviewNote,
    },
  });

  let decryptedPayload: Record<string, unknown> | null = null;
  if (params.decision === "APPROVED") {
    const raw = decrypt(request.payloadEncrypted);
    if (raw) {
      try {
        decryptedPayload = JSON.parse(raw);
      } catch {
        decryptedPayload = null;
      }
    }
  }

  return { request: updated, payload: decryptedPayload };
}
