import { redirect } from "next/navigation";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTH, formatTHB } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/queries";

export default async function MyOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/orders");

  const orders = await getOrdersForUser(user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: "หน้าแรก", href: "/" }, { label: "คำสั่งซื้อของฉัน" }]} />
      <h1 className="mt-4 mb-8 text-2xl font-bold text-foreground">คำสั่งซื้อของฉัน</h1>

      {orders.length === 0 ? (
        <EmptyState icon={PackageSearch} title="ยังไม่มีคำสั่งซื้อ" description="เมื่อคุณสั่งซื้อสินค้า รายการจะแสดงที่นี่" />
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <Link key={order.orderNumber} href={`/orders/${order.orderNumber}`}>
              <Card className="flex flex-col gap-3 p-4 transition-colors hover:border-border-strong sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{order.orderNumber}</p>
                  <p className="text-sm text-muted">{order.productTitle}</p>
                  <p className="mt-1 text-xs text-muted-2">{formatDateTH(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1.5">
                  <span className="text-sm font-bold text-foreground">{formatTHB(order.price)}</span>
                  <StatusBadge status={order.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
