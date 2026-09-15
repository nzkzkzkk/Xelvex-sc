import { notFound } from "next/navigation";
import Image from "next/image";
import { Zap } from "lucide-react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Tabs } from "@/components/ui/Tabs";
import { ProductBuyPanel } from "@/components/marketplace/ProductBuyPanel";
import { getGames, getProductBySlug } from "@/lib/queries";

// See src/app/(storefront)/games/page.tsx for why this is forced dynamic.
export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const games = await getGames();
  const gameSlug = games.find((g) => g.id === product.gameId)?.slug ?? "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb
        items={[
          { label: "หน้าแรก", href: "/" },
          { label: product.gameName, href: `/products?game=${gameSlug}` },
          { label: product.title },
        ]}
      />

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="clip-x-md relative aspect-square w-full overflow-hidden border border-border bg-surface">
          {product.image ? (
            <Image src={product.image} alt={product.title} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-2">
              <Zap className="h-16 w-16" />
            </div>
          )}
        </div>

        <ProductBuyPanel product={product} />
      </div>

      <div className="mt-12 max-w-3xl">
        <Tabs
          items={[
            {
              key: "detail",
              label: "รายละเอียดสินค้า",
              content: (
                <p>
                  {product.title} {product.subtitle} สำหรับเกม {product.gameName} — โค้ดจริงจากผู้จัดจำหน่ายที่ได้รับอนุญาต จัดส่งอัตโนมัติทันทีหลังชำระเงินสำเร็จ
                </p>
              ),
            },
            {
              key: "howto",
              label: "วิธีใช้งาน",
              content: (
                <ol className="list-decimal space-y-1.5 pl-5">
                  <li>ชำระเงินและรอระบบตรวจสอบ</li>
                  <li>เปิดหน้า My Orders เพื่อดูโค้ด/รายละเอียดสินค้า</li>
                  <li>คัดลอกโค้ดและใช้งานตามคำแนะนำของแพลตฟอร์มเกม</li>
                </ol>
              ),
            },
            {
              key: "delivery",
              label: "การจัดส่ง",
              content: <p>จัดส่งอัตโนมัติผ่านระบบหลังบ้านทันทีที่ยืนยันการชำระเงินสำเร็จ ปกติภายในไม่กี่วินาที</p>,
            },
            {
              key: "info",
              label: "ข้อมูลสำคัญ",
              content: <p>สินค้านี้เป็นโค้ด/บัตรดิจิทัลที่จัดซื้อจากตัวแทนจำหน่ายที่ได้รับอนุญาต ไม่รองรับการคืนเงินหลังจากเปิดเผยโค้ดแล้ว</p>,
            },
          ]}
        />
      </div>
    </div>
  );
}
