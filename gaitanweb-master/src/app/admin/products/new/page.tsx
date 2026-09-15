import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ProductForm } from "@/components/admin/ProductForm";
import { getAdminGames } from "@/lib/admin-queries";

export default async function NewProductPage() {
  const games = await getAdminGames();

  return (
    <div>
      <AdminPageHeader title="เพิ่มสินค้า" description="เพิ่มสินค้าใหม่เข้าแคตตาล็อก" />
      <ProductForm games={games} />
    </div>
  );
}
