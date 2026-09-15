import { notFound, redirect } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { DeliveryCodeReveal } from "@/components/marketplace/DeliveryCodeReveal";
import { getCurrentUser } from "@/lib/auth";
import { getDeliveredItems } from "@/lib/queries";

export default async function DeliveryPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/orders/${orderNumber}/delivery`);

  const items = await getDeliveredItems(orderNumber, user);
  if (!items) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb
        items={[
          { label: "หน้าแรก", href: "/" },
          { label: "คำสั่งซื้อของฉัน", href: "/orders" },
          { label: orderNumber, href: `/orders/${orderNumber}` },
          { label: "รับสินค้า" },
        ]}
      />

      <h1 className="mt-4 mb-6 text-2xl font-bold text-foreground">สินค้าของคุณ</h1>

      <DeliveryCodeReveal items={items} />
    </div>
  );
}
