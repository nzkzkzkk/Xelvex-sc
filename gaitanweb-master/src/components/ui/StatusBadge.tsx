import { Badge } from "./Badge";
import type { OrderStatus } from "@/types";

const STATUS_MAP: Record<OrderStatus, { label: string; tone: "neutral" | "primary" | "success" | "warning" | "danger" | "info" }> = {
  PENDING_PAYMENT: { label: "รอชำระเงิน", tone: "warning" },
  PAID: { label: "ชำระเงินแล้ว", tone: "info" },
  PROCESSING: { label: "กำลังจัดเตรียม", tone: "primary" },
  DELIVERED: { label: "จัดส่งแล้ว", tone: "success" },
  CANCELLED: { label: "ยกเลิก", tone: "neutral" },
  FAILED: { label: "ล้มเหลว", tone: "danger" },
  REFUNDED: { label: "คืนเงินแล้ว", tone: "info" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, tone } = STATUS_MAP[status];
  return <Badge tone={tone}>{label}</Badge>;
}
