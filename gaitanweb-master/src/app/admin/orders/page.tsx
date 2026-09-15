import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FilterPills } from "@/components/admin/FilterControls";
import { Table, THead, Th, TBody, Tr, Td } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTH, formatTHB } from "@/lib/utils";
import { getAdminOrders } from "@/lib/admin-queries";
import type { OrderStatus } from "@/types";

const STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "PENDING_PAYMENT", label: "รอชำระเงิน" },
  { value: "PAID", label: "ชำระแล้ว" },
  { value: "PROCESSING", label: "รอจัดส่ง" },
  { value: "DELIVERED", label: "จัดส่งแล้ว" },
  { value: "FAILED", label: "ล้มเหลว" },
  { value: "CANCELLED", label: "ยกเลิก" },
  { value: "REFUNDED", label: "คืนเงินแล้ว" },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}) {
  const { q, page, status: statusParam } = await searchParams;
  const status = STATUSES.find((s) => s.value === statusParam)?.value;
  const { rows: orders, totalPages, page: currentPage, total } = await getAdminOrders({
    q,
    page: page ? Number(page) : 1,
    status,
  });

  return (
    <div>
      <AdminPageHeader
        title="คำสั่งซื้อ"
        description={`ทั้งหมด ${total} รายการ`}
        searchPlaceholder="เลขที่ออเดอร์ หรืออีเมลลูกค้า..."
        searchDefault={q}
        hiddenParams={{ status }}
        filters={<FilterPills name="status" value={status} options={STATUSES} />}
      />

      {orders.length === 0 ? (
        <EmptyState title="ไม่พบคำสั่งซื้อ" description={q || status ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง" : "เมื่อลูกค้าสั่งซื้อสินค้า รายการจะแสดงที่นี่"} />
      ) : (
        <>
          <Table>
            <THead>
              <Th>ออเดอร์</Th>
              <Th>ลูกค้า</Th>
              <Th>สินค้า</Th>
              <Th>ยอดชำระ</Th>
              <Th>สถานะ</Th>
              <Th>วันที่</Th>
              <Th className="text-right">จัดการ</Th>
            </THead>
            <TBody>
              {orders.map((order) => (
                <Tr key={order.orderNumber}>
                  <Td primary>
                    <Link href={`/admin/orders/${order.orderNumber}`} className="font-medium text-primary-soft hover:underline">
                      {order.orderNumber}
                    </Link>
                  </Td>
                  <Td label="ลูกค้า" className="text-muted">{order.customerEmail}</Td>
                  <Td label="สินค้า" className="text-muted">
                    {order.productTitle}
                    {order.itemCount > 1 && <span className="text-muted-2"> ({order.itemCount} ชิ้น)</span>}
                  </Td>
                  <Td label="ยอดชำระ" className="font-semibold">{formatTHB(order.price)}</Td>
                  <Td label="สถานะ">
                    <StatusBadge status={order.status} />
                  </Td>
                  <Td label="วันที่" className="whitespace-nowrap text-muted">{formatDateTH(order.createdAt)}</Td>
                  <Td actions className="text-right">
                    <Link href={`/admin/orders/${order.orderNumber}`} className="text-xs font-medium text-primary-soft hover:underline">
                      จัดการ
                    </Link>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>

          <Pagination page={currentPage} totalPages={totalPages} basePath="/admin/orders" query={{ q, status }} />
        </>
      )}
    </div>
  );
}
