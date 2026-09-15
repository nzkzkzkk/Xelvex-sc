import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { OrderActions } from "@/components/admin/OrderActions";
import { AdminCodeReveal } from "@/components/admin/AdminCodeReveal";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, THead, Th, TBody, Tr, Td } from "@/components/ui/Table";
import { formatDateTH, formatTHB } from "@/lib/utils";
import { getAdminOrderDetail } from "@/lib/admin-queries";

const METHOD_LABEL: Record<string, string> = {
  truemoney: "TrueMoney Wallet",
  promptpay: "พร้อมเพย์ / QR",
  card: "บัตรเครดิต / เดบิต",
};

const PAYMENT_TONE: Record<string, "success" | "warning" | "danger" | "info"> = {
  SUCCESS: "success",
  PENDING: "warning",
  FAILED: "danger",
  REFUNDED: "info",
};

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const order = await getAdminOrderDetail(orderNumber);
  if (!order) notFound();

  const hasCodes = order.items.some((i) => i.stockStatus);

  return (
    <div>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> กลับไปรายการคำสั่งซื้อ
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{order.orderNumber}</h1>
          <p className="text-sm text-muted">
            สร้างเมื่อ {formatDateTH(order.createdAt)} · อัปเดตล่าสุด {formatDateTH(order.updatedAt)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <Card className="p-0">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-sm font-semibold text-foreground">รายการสินค้า ({order.items.length} ชิ้น)</h2>
              {order.unfulfilledCount > 0 && <Badge tone="warning">{order.unfulfilledCount} ชิ้นยังไม่มีโค้ด</Badge>}
            </div>
            <Table>
              <THead>
                <Th>สินค้า</Th>
                <Th>ราคา</Th>
                <Th>โค้ด</Th>
                <Th>การจัดส่ง</Th>
              </THead>
              <TBody>
                {order.items.map((item) => (
                  <Tr key={item.id}>
                    <Td primary>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-2">{item.gameName}</p>
                    </Td>
                    <Td label="ราคา">{formatTHB(item.unitPrice)}</Td>
                    <Td label="โค้ด">
                      {item.maskedCode ? (
                        <code className="text-xs text-muted">{item.maskedCode}</code>
                      ) : (
                        <span className="text-xs text-warning">รอสต๊อก</span>
                      )}
                    </Td>
                    <Td label="การจัดส่ง">
                      {item.deliveryStatus === "DELIVERED" ? (
                        <span className="text-xs text-success">ส่งแล้ว {item.deliveredAt ? formatDateTH(item.deliveredAt) : ""}</span>
                      ) : (
                        <span className="text-xs text-muted-2">—</span>
                      )}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </Card>

          <Card className="p-0">
            <h2 className="px-5 pt-5 pb-3 text-sm font-semibold text-foreground">การชำระเงิน</h2>
            {order.payments.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-muted-2">ยังไม่มีรายการชำระเงิน</p>
            ) : (
              <Table>
                <THead>
                  <Th>Transaction</Th>
                  <Th>ช่องทาง</Th>
                  <Th>จำนวน</Th>
                  <Th>สถานะ</Th>
                  <Th>เวลา</Th>
                </THead>
                <TBody>
                  {order.payments.map((p) => (
                    <Tr key={p.id}>
                      <Td primary>
                        <code className="text-xs">{p.transactionId}</code>
                      </Td>
                      <Td label="ช่องทาง" className="text-muted">{p.provider}</Td>
                      <Td label="จำนวน">{formatTHB(p.amount)}</Td>
                      <Td label="สถานะ">
                        <Badge tone={PAYMENT_TONE[p.status] ?? "neutral"}>{p.status}</Badge>
                      </Td>
                      <Td label="เวลา" className="whitespace-nowrap text-muted">{formatDateTH(p.paidAt ?? p.createdAt)}</Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>

          {hasCodes && (
            <Card className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-foreground">โค้ดที่ส่งให้ลูกค้า</h2>
              <AdminCodeReveal orderNumber={order.orderNumber} />
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">ลูกค้า</h2>
            <p className="font-medium text-foreground">{order.customer.displayName}</p>
            <p className="text-sm text-muted">{order.customer.email}</p>
            <Link href={`/admin/users/${order.customer.id}`} className="mt-2 inline-block text-xs font-medium text-primary-soft hover:underline">
              ดูประวัติลูกค้า →
            </Link>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">สรุป</h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">ช่องทางที่ลูกค้าเลือก</dt>
                <dd className="text-foreground">{order.paymentMethod ? (METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod) : "ไม่ระบุ"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">จำนวนชิ้น</dt>
                <dd className="text-foreground">{order.items.length}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                <dt className="text-foreground">ยอดรวม</dt>
                <dd className="text-primary-soft">{formatTHB(order.totalAmount)}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">การดำเนินการ</h2>
            <OrderActions
              orderNumber={order.orderNumber}
              status={order.status}
              unfulfilledCount={order.unfulfilledCount}
              totalLabel={formatTHB(order.totalAmount)}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
