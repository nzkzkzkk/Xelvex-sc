import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StockForm } from "@/components/admin/StockForm";
import { getProductOptions } from "@/lib/admin-queries";

export default async function NewStockPage({ searchParams }: { searchParams: Promise<{ productId?: string }> }) {
  const [{ productId }, products] = await Promise.all([searchParams, getProductOptions()]);

  return (
    <div>
      <AdminPageHeader title="เพิ่มสต๊อก" description="วางโค้ดทีละบรรทัด หรือนำเข้าจากไฟล์ — โค้ดที่มีอยู่แล้วจะถูกข้ามอัตโนมัติ" />
      <StockForm products={products} defaultProductId={productId} />
    </div>
  );
}
