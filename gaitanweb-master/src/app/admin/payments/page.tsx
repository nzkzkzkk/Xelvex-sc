import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FilterPills } from "@/components/admin/FilterControls";
import { Table, THead, Th, TBody, Tr, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTH, formatTHB } from "@/lib/utils";
import { getAdminPayments } from "@/lib/admin-queries";
import type { PaymentStatus } from "@/types";

const STATUSES: { value: PaymentStatus; label: string; tone: "success" | "warning" | "danger" | "info" }[] = [
  { value: "SUCCESS", label: "สำเร็จ", tone: "success" },
  { value: "PENDING", label: "รอดำเนินการ", tone: "warning" },
  { value: "FAILED", label: "ล้มเหลว", tone: "danger" },
  { value: "REFUNDED", label: "คืนเงินแล้ว", tone: "info" },
];

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}) {
  const { q, page, status: statusParam } = await searchParams;
  const status = STATUSES.find((s) => s.value === statusParam)?.value;
  const { rows: payments, totalPages, page: currentPage, total } = await getAdminPayments({
    q,
    page: page ? Number(page) : 1,
    status,
  });

  return (
    <div>
      <AdminPageHeader
        title="การชำระเงิน"
        description={`ทั้งหมด ${total} รายการ`}
        searchPlaceholder="Transaction ID หรือเลขที่ออเดอร์..."
        searchDefault={q}
        hiddenParams={{ status }}
        filters={<FilterPills name="status" value={status} options={STATUSES.map(({ value, label }) => ({ value, label }))} />}
      />

      {payments.length === 0 ? (
        <EmptyState title="ไม่พบรายการชำระเงิน" description={q || status ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง" : "เมื่อมีการชำระเงิน รายการจะแสดงที่นี่"} />
      ) : (
        <>
          <Table>
            <THead>
              <Th>Transaction ID</Th>
              <Th>ออเดอร์</Th>
              <Th>ช่องทาง</Th>
              <Th>จำนวน</Th>
              <Th>สถานะ</Th>
              <Th>ชำระเมื่อ</Th>
            </THead>
            <TBody>
              {payments.map((p) => {
                const meta = STATUSES.find((s) => s.value === p.status);
                return (
                  <Tr key={p.id}>
                    <Td primary>
                      <code className="text-xs">{p.transactionId}</code>
                    </Td>
                    <Td label="ออเดอร์">
                      <Link href={`/admin/orders/${p.orderNumber}`} className="text-primary-soft hover:underline">
                        {p.orderNumber}
                      </Link>
                    </Td>
                    <Td label="ช่องทาง" className="text-muted">{p.provider}</Td>
                    <Td label="จำนวน" className="font-semibold">{formatTHB(p.amount)}</Td>
                    <Td label="สถานะ">
                      <Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? p.status}</Badge>
                    </Td>
                    <Td label="ชำระเมื่อ" className="whitespace-nowrap text-muted">{p.paidAt ? formatDateTH(p.paidAt) : "—"}</Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>

          <Pagination page={currentPage} totalPages={totalPages} basePath="/admin/payments" query={{ q, status }} />
        </>
      )}
    </div>
  );
}
