import Link from "next/link";
import { DollarSign, Receipt, ShoppingCart, UserPlus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { AreaChart, BarList, Donut } from "@/components/admin/charts";
import { Card } from "@/components/ui/Card";
import { getGameTheme } from "@/lib/game-theme";
import { cn, formatTHB } from "@/lib/utils";
import { getAnalytics } from "@/lib/admin-queries";
import type { OrderStatus } from "@/types";

const PERIODS = [
  { days: 7, label: "7 วัน" },
  { days: 30, label: "30 วัน" },
  { days: 90, label: "90 วัน" },
];

const STATUS_META: Record<OrderStatus, { label: string; color: string }> = {
  DELIVERED: { label: "จัดส่งแล้ว", color: "var(--success)" },
  PAID: { label: "ชำระแล้ว", color: "var(--info)" },
  PROCESSING: { label: "กำลังจัดส่ง", color: "var(--accent-cyan)" },
  PENDING_PAYMENT: { label: "รอชำระเงิน", color: "var(--warning)" },
  FAILED: { label: "ล้มเหลว", color: "var(--danger)" },
  CANCELLED: { label: "ยกเลิก", color: "var(--muted-2)" },
  REFUNDED: { label: "คืนเงิน", color: "var(--accent-pink)" },
};

const METHOD_META: Record<string, { label: string; color: string }> = {
  truemoney: { label: "TrueMoney Wallet", color: "#f97316" },
  promptpay: { label: "พร้อมเพย์ / QR", color: "#38bdf8" },
  card: { label: "บัตรเครดิต / เดบิต", color: "#9d5ff0" },
  unknown: { label: "ไม่ระบุ (ออเดอร์ก่อนบันทึกช่องทาง)", color: "var(--muted-2)" },
};

function trendOf(current: number, previous: number): { text: string; tone: "up" | "down" | "neutral" } {
  if (previous === 0 && current === 0) return { text: "ไม่มีข้อมูลช่วงก่อนหน้า", tone: "neutral" };
  if (previous === 0) return { text: "▲ ใหม่ในช่วงนี้", tone: "up" };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { text: "เท่ากับช่วงก่อนหน้า", tone: "neutral" };
  return { text: `${pct > 0 ? "▲" : "▼"} ${Math.abs(pct)}% เทียบช่วงก่อนหน้า`, tone: pct > 0 ? "up" : "down" };
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: daysParam } = await searchParams;
  const days = PERIODS.find((p) => String(p.days) === daysParam)?.days ?? 30;
  const data = await getAnalytics(days);
  const { summary } = data;
  const revenueTrend = trendOf(summary.revenue, summary.prevRevenue);
  const orderTrend = trendOf(summary.orders, summary.prevOrders);

  return (
    <div>
      <AdminPageHeader
        title="สถิติร้าน"
        description={`ยอดขายและพฤติกรรมลูกค้าจากข้อมูลจริง ${days} วันล่าสุด`}
        action={
          <div className="flex items-center gap-2">
            {PERIODS.map((p) => (
              <Link
                key={p.days}
                href={`/admin/analytics?days=${p.days}`}
                className={cn(
                  "clip-x-sm border px-3.5 py-1.5 text-xs font-bold tracking-wide transition-colors",
                  p.days === days
                    ? "border-primary bg-primary/10 text-primary-soft"
                    : "border-border text-muted hover:border-border-strong hover:text-foreground"
                )}
              >
                {p.label}
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="รายได้ (ชำระแล้ว)"
          value={formatTHB(summary.revenue)}
          trend={revenueTrend.text}
          trendTone={revenueTrend.tone}
          tone="success"
        />
        <StatCard
          icon={ShoppingCart}
          label="ออเดอร์ที่ชำระแล้ว"
          value={String(summary.orders)}
          trend={orderTrend.text}
          trendTone={orderTrend.tone}
        />
        <StatCard
          icon={Receipt}
          label="ยอดเฉลี่ยต่อออเดอร์"
          value={formatTHB(summary.avgOrder)}
          trend={summary.failedOrders > 0 ? `${summary.failedOrders} ออเดอร์ล้มเหลว/ยกเลิก` : "ไม่มีออเดอร์ล้มเหลว"}
          trendTone={summary.failedOrders > 0 ? "down" : "neutral"}
        />
        <StatCard icon={UserPlus} label="ลูกค้าใหม่" value={String(summary.newCustomers)} trend="สมัครสมาชิกในช่วงนี้" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-foreground">ยอดขายรายวัน</h2>
            <span className="text-xs text-muted-2">เฉพาะออเดอร์ที่ชำระเงินสำเร็จ</span>
          </div>
          <AreaChart points={data.daily.map((d) => ({ label: d.label, value: d.revenue }))} />
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">สถานะคำสั่งซื้อ</h2>
          <Donut
            centerLabel="ออเดอร์"
            slices={data.orderStatus.map((s) => ({
              label: STATUS_META[s.status]?.label ?? s.status,
              value: s.count,
              color: STATUS_META[s.status]?.color ?? "var(--muted-2)",
            }))}
          />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">สินค้าขายดี</h2>
          <BarList
            rows={data.topProducts.map((p) => ({
              label: p.title,
              sublabel: `${p.units} ชิ้น`,
              value: p.revenue,
              display: formatTHB(p.revenue),
              color: getGameTheme(p.gameName).gradient,
            }))}
          />
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">ยอดขายตามเกม</h2>
          <BarList
            rows={data.byGame.map((g) => ({
              label: g.name,
              sublabel: `${g.units} ชิ้น`,
              value: g.revenue,
              display: formatTHB(g.revenue),
              color: getGameTheme(g.name).gradient,
            }))}
          />
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">ช่องทางชำระเงินที่ลูกค้าเลือก</h2>
          </div>
          <Donut
            centerLabel="ออเดอร์"
            slices={data.paymentMethods.map((m) => ({
              label: METHOD_META[m.method]?.label ?? m.method,
              value: m.count,
              color: METHOD_META[m.method]?.color ?? "var(--muted-2)",
            }))}
          />
        </Card>
      </div>
    </div>
  );
}
