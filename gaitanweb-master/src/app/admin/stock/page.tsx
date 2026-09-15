import Link from "next/link";
import { Plus, ShieldAlert } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FilterPills, FilterSelect } from "@/components/admin/FilterControls";
import { StockTable } from "@/components/admin/StockTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { getAdminStock, getProductOptions, getStockSummary, LOW_STOCK_THRESHOLD } from "@/lib/admin-queries";
import type { StockStatus } from "@/types";

const STATUSES: StockStatus[] = ["AVAILABLE", "SOLD", "DISABLED", "RESERVED"];
const STATUS_LABEL: Record<StockStatus, string> = {
  AVAILABLE: "พร้อมขาย",
  SOLD: "ขายแล้ว",
  DISABLED: "ปิดใช้งาน",
  RESERVED: "จองแล้ว",
};

export default async function AdminStockPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; product?: string; status?: string }>;
}) {
  const { q, page, product, status: statusParam } = await searchParams;
  const status = STATUSES.includes(statusParam as StockStatus) ? (statusParam as StockStatus) : undefined;
  const [products, summary, { rows, totalPages, page: currentPage, total }] = await Promise.all([
    getProductOptions(),
    getStockSummary(),
    getAdminStock({ q, page: page ? Number(page) : 1, productId: product, status }),
  ]);
  const query = { q, product, status };

  return (
    <div>
      <AdminPageHeader
        title="สต๊อกสินค้า"
        description={`ทั้งหมด ${total} รายการ`}
        searchPlaceholder="ค้นหาชื่อสินค้า..."
        searchDefault={q}
        hiddenParams={{ product, status }}
        filters={
          <>
            <FilterSelect name="product" value={product} allLabel="ทุกสินค้า" options={products.map((p) => ({ value: p.id, label: p.label }))} />
            <FilterPills name="status" value={status} options={STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))} />
          </>
        }
        action={
          <Link href={product ? `/admin/stock/new?productId=${product}` : "/admin/stock/new"}>
            <Button size="sm">
              <Plus className="h-4 w-4" /> เพิ่มสต๊อก
            </Button>
          </Link>
        }
      />

      <Card className="mb-6 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">สรุปสต๊อกต่อสินค้า</h2>
          <span className="text-xs text-muted-2">เตือนเมื่อเหลือ ≤ {LOW_STOCK_THRESHOLD}</span>
        </div>
        {summary.length === 0 ? (
          <p className="text-sm text-muted-2">ยังไม่มีสินค้าที่เปิดขาย</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {summary.map((p) => {
              const low = p.available <= LOW_STOCK_THRESHOLD;
              return (
                <Link
                  key={p.id}
                  href={`/admin/stock?product=${p.id}`}
                  className={cn(
                    "clip-x-sm flex items-center justify-between gap-2 border px-3 py-2.5 text-sm transition-colors hover:bg-surface-2",
                    product === p.id ? "border-primary bg-primary/10" : low ? "border-warning/40" : "border-border"
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-foreground">{p.title}</span>
                    <span className="block text-[11px] text-muted-2">
                      {p.gameName} · ขายแล้ว {p.sold}
                    </span>
                  </span>
                  <Badge tone={p.available === 0 ? "danger" : low ? "warning" : "success"} className="shrink-0">
                    {p.available}
                  </Badge>
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-[var(--warning-soft)] p-3 text-xs text-warning">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        โค้ดจะถูกปิดบังในหน้านี้ กด &quot;ดูโค้ด&quot; ได้เมื่อจำเป็นเท่านั้น — ทุกครั้งที่เปิดดูจะถูกบันทึกในประวัติการทำรายการ
      </div>

      {rows.length === 0 ? (
        <EmptyState title="ไม่พบรายการสต๊อก" description={q || product || status ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง" : "ยังไม่มีสต๊อกในระบบ"} />
      ) : (
        <>
          <StockTable rows={rows} />
          <Pagination page={currentPage} totalPages={totalPages} basePath="/admin/stock" query={query} />
        </>
      )}
    </div>
  );
}
