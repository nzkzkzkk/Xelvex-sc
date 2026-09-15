import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FilterPills, FilterSelect } from "@/components/admin/FilterControls";
import { ProductsTable } from "@/components/admin/ProductsTable";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { getAdminGames, getAdminProducts } from "@/lib/admin-queries";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; game?: string; status?: string }>;
}) {
  const { q, page, game, status: statusParam } = await searchParams;
  const status = statusParam === "active" || statusParam === "inactive" ? statusParam : undefined;
  const [games, { rows, totalPages, page: currentPage, total }] = await Promise.all([
    getAdminGames(),
    getAdminProducts({ q, page: page ? Number(page) : 1, gameId: game, status }),
  ]);
  const query = { q, game, status };

  return (
    <div>
      <AdminPageHeader
        title="สินค้า"
        description={`ทั้งหมด ${total} รายการ`}
        searchPlaceholder="ค้นหาชื่อสินค้า / หมวดหมู่..."
        searchDefault={q}
        hiddenParams={{ game, status }}
        filters={
          <>
            <FilterSelect name="game" value={game} allLabel="ทุกเกม" options={games.map((g) => ({ value: g.id, label: g.name }))} />
            <FilterPills
              name="status"
              value={status}
              options={[
                { value: "active", label: "เปิดขาย" },
                { value: "inactive", label: "ปิดขาย" },
              ]}
            />
          </>
        }
        action={
          <Link href="/admin/products/new">
            <Button size="sm">
              <Plus className="h-4 w-4" /> เพิ่มสินค้า
            </Button>
          </Link>
        }
      />

      {rows.length === 0 ? (
        <EmptyState title="ไม่พบสินค้า" description={q || game || status ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง" : "ยังไม่มีสินค้าในระบบ"} />
      ) : (
        <>
          <ProductsTable rows={rows} />
          <Pagination page={currentPage} totalPages={totalPages} basePath="/admin/products" query={query} />
        </>
      )}
    </div>
  );
}
