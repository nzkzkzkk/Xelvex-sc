import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Timeline, type TimelineStep } from "@/components/ui/Timeline";
import { Button } from "@/components/ui/Button";
import { formatDateTH, formatTHB } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { getOrderDetail } from "@/lib/queries";
import type { OrderStatus } from "@/types";

const ORDER_STAGES: OrderStatus[] = ["PAID", "PROCESSING", "DELIVERED"];

function buildTimeline(status: OrderStatus, createdAt: string): TimelineStep[] {
  const currentIndex = ORDER_STAGES.indexOf(status);
  const labels: Record<OrderStatus, string> = {
    PENDING_PAYMENT: "รอชำระเงิน",
    PAID: "ชำระเงินแล้ว",
    PROCESSING: "กำลังจัดเตรียม",
    DELIVERED: "จัดส่งแล้ว",
    CANCELLED: "ยกเลิก",
    FAILED: "ล้มเหลว",
    REFUNDED: "คืนเงินแล้ว",
  };

  return [
    { label: "สร้างคำสั่งซื้อ", timestamp: formatDateTH(createdAt), state: "done" },
    ...ORDER_STAGES.map((stage, i) => ({
      label: labels[stage],
      state:
        currentIndex === -1
          ? ("upcoming" as const)
          : i < currentIndex
            ? ("done" as const)
            : i === currentIndex
              ? ("current" as const)
              : ("upcoming" as const),
    })),
  ];
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/orders/${orderNumber}`);

  const order = await getOrderDetail(orderNumber, user);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb
        items={[
          { label: "หน้าแรก", href: "/" },
          { label: "คำสั่งซื้อของฉัน", href: "/orders" },
          { label: order.orderNumber },
        ]}
      />

      <div className="mt-4 mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">{order.orderNumber}</h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_260px]">
        <Card className="p-6">
          <h2 className="mb-5 text-sm font-semibold text-foreground">สถานะคำสั่งซื้อ</h2>
          <Timeline steps={buildTimeline(order.status, order.createdAt)} />
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">รายละเอียด</h2>
            <div className="flex flex-col gap-2 text-sm">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-muted">
                  <span>
                    {item.title} {item.subtitle} × {item.quantity}
                  </span>
                  <span className="text-right text-foreground">{formatTHB(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-border pt-2 font-semibold text-foreground">
                <span>ยอดชำระ</span>
                <span>{formatTHB(order.totalAmount)}</span>
              </div>
            </div>
          </Card>

          {order.status === "DELIVERED" && (
            <Link href={`/orders/${order.orderNumber}/delivery`}>
              <Button className="w-full">ดูสินค้าที่ได้รับ</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
