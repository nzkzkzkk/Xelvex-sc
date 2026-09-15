import { AdminActionButton } from "@/components/admin/AdminActionButton";
import type { OrderStatus } from "@/types";

export function OrderActions({
  orderNumber,
  status,
  unfulfilledCount,
  totalLabel,
}: {
  orderNumber: string;
  status: OrderStatus;
  unfulfilledCount: number;
  totalLabel: string;
}) {
  const url = `/api/admin/orders/${orderNumber}`;
  const actions: React.ReactNode[] = [];

  if (status === "PENDING_PAYMENT") {
    actions.push(
      <AdminActionButton
        key="mark_paid"
        variant="button"
        label="ยืนยันว่าชำระเงินแล้ว"
        request={{ url, body: { action: "mark_paid" } }}
        confirm={{
          tone: "primary",
          title: "ยืนยันว่าลูกค้าชำระเงินแล้ว?",
          description: `ระบบจะบันทึกการชำระ ${totalLabel} แบบ manual และจัดส่งโค้ดให้ลูกค้าทันที ใช้เมื่อตรวจสอบยอดโอนด้วยตัวเองแล้วเท่านั้น`,
          confirmLabel: "ยืนยันและจัดส่ง",
        }}
      />
    );
  }
  if (status === "PENDING_PAYMENT" || status === "FAILED") {
    actions.push(
      <AdminActionButton
        key="cancel"
        variant="button"
        tone="danger"
        label="ยกเลิกออเดอร์"
        request={{ url, body: { action: "cancel" } }}
        confirm={{ title: "ยกเลิกออเดอร์นี้?", description: "ลูกค้าจะไม่สามารถชำระเงินสำหรับออเดอร์นี้ได้อีก", confirmLabel: "ยกเลิกออเดอร์" }}
      />
    );
  }
  if (status === "PROCESSING" || status === "PAID") {
    actions.push(
      <AdminActionButton
        key="retry"
        variant="button"
        label={unfulfilledCount > 0 ? `ลองจัดส่งอีกครั้ง (${unfulfilledCount} ชิ้นรอสต๊อก)` : "ลองจัดส่งอีกครั้ง"}
        request={{ url, body: { action: "retry_delivery" } }}
        confirm={{
          tone: "primary",
          title: "จัดส่งรายการที่ค้างอยู่?",
          description: "ระบบจะหยิบโค้ดจากสต๊อกที่พร้อมขายให้รายการที่ยังไม่ได้รับ ถ้าสต๊อกยังไม่พอจะค้างต่อ",
          confirmLabel: "จัดส่ง",
        }}
      />
    );
  }
  if (status === "PAID" || status === "PROCESSING" || status === "DELIVERED") {
    actions.push(
      <AdminActionButton
        key="refund"
        variant="button"
        tone="danger"
        label="บันทึกการคืนเงิน"
        request={{ url, body: { action: "refund" } }}
        confirm={{
          title: `บันทึกว่าคืนเงิน ${totalLabel} แล้ว?`,
          description: "เป็นการบันทึกสถานะเท่านั้น ต้องโอนเงินคืนลูกค้าเอง โค้ดที่ส่งไปแล้วจะไม่ถูกนำกลับมาขายซ้ำ",
          confirmLabel: "บันทึกคืนเงิน",
        }}
      />
    );
  }

  if (actions.length === 0) {
    return <p className="text-sm text-muted-2">ไม่มีการดำเนินการสำหรับสถานะนี้</p>;
  }
  return <div className="flex flex-col items-stretch gap-2 [&>div]:w-full [&>div>button]:w-full">{actions}</div>;
}
