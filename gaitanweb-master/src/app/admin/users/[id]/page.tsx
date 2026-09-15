import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, DollarSign, ShoppingCart, User } from "lucide-react";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { StatCard } from "@/components/admin/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, THead, Th, TBody, Tr, Td } from "@/components/ui/Table";
import { formatDateTH, formatTHB } from "@/lib/utils";
import { getAdminUserDetail } from "@/lib/admin-queries";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, user] = await Promise.all([getCurrentUser(), getAdminUserDetail(id)]);
  if (!user) notFound();
  const isMe = me?.id === user.id;

  return (
    <div>
      <Link href="/admin/users" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> กลับไปรายชื่อผู้ใช้
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{user.displayName}</h1>
          <p className="text-sm text-muted">
            {user.email} · สมัครเมื่อ {formatDateTH(user.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={user.role === "ADMIN" ? "primary" : "neutral"}>{user.role === "ADMIN" ? "แอดมิน" : "ลูกค้า"}</Badge>
          <Badge tone={user.isActive ? "success" : "danger"}>{user.isActive ? "ใช้งานอยู่" : "ระงับ"}</Badge>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={ShoppingCart} label="ออเดอร์ทั้งหมด" value={String(user.stats.orderCount)} />
        <StatCard icon={User} label="ชำระสำเร็จ" value={String(user.stats.paidCount)} tone="success" />
        <StatCard icon={DollarSign} label="ยอดซื้อรวม" value={formatTHB(user.stats.totalSpent)} tone="success" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
        <Card className="p-0">
          <h2 className="px-5 pt-5 pb-3 text-sm font-semibold text-foreground">ประวัติการสั่งซื้อ (ล่าสุด {user.orders.length})</h2>
          {user.orders.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted-2">ยังไม่เคยสั่งซื้อ</p>
          ) : (
            <Table>
              <THead>
                <Th>ออเดอร์</Th>
                <Th>สินค้า</Th>
                <Th>ยอด</Th>
                <Th>สถานะ</Th>
                <Th>วันที่</Th>
              </THead>
              <TBody>
                {user.orders.map((o) => (
                  <Tr key={o.orderNumber}>
                    <Td primary>
                      <Link href={`/admin/orders/${o.orderNumber}`} className="font-medium text-primary-soft hover:underline">
                        {o.orderNumber}
                      </Link>
                    </Td>
                    <Td label="สินค้า" className="text-muted">{o.productTitle}</Td>
                    <Td label="ยอด" className="font-semibold">{formatTHB(o.price)}</Td>
                    <Td label="สถานะ">
                      <StatusBadge status={o.status} />
                    </Td>
                    <Td label="วันที่" className="whitespace-nowrap text-muted">{formatDateTH(o.createdAt)}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </Card>

        <Card className="h-fit p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">การดำเนินการ</h2>
          {isMe ? (
            <p className="text-sm text-muted-2">แก้ไขบัญชีของตัวเองจากหน้านี้ไม่ได้</p>
          ) : (
            <div className="flex flex-col gap-2 [&>div]:w-full [&>div>button]:w-full">
              <AdminActionButton
                variant="button"
                label={user.role === "ADMIN" ? "ถอดสิทธิ์แอดมิน" : "ตั้งเป็นแอดมิน"}
                request={{ url: `/api/admin/users/${user.id}`, body: { role: user.role === "ADMIN" ? "CUSTOMER" : "ADMIN" } }}
                confirm={{
                  tone: "primary",
                  title: user.role === "ADMIN" ? "ถอดสิทธิ์แอดมิน?" : "ตั้งเป็นแอดมิน?",
                  description: user.role === "ADMIN" ? "บัญชีนี้จะเข้าหลังบ้านไม่ได้อีก" : "บัญชีนี้จะจัดการสินค้า สต๊อก ออเดอร์ และเห็นโค้ดทั้งหมดได้",
                  confirmLabel: user.role === "ADMIN" ? "ถอดสิทธิ์" : "ตั้งเป็นแอดมิน",
                }}
              />
              <AdminActionButton
                variant="button"
                tone={user.isActive ? "danger" : "primary"}
                label={user.isActive ? "ระงับบัญชี" : "ยกเลิกระงับ"}
                request={{ url: `/api/admin/users/${user.id}`, body: { isActive: !user.isActive } }}
                confirm={
                  user.isActive
                    ? { title: "ระงับบัญชีนี้?", description: "ผู้ใช้จะถูกออกจากระบบและเข้าสู่ระบบไม่ได้จนกว่าจะยกเลิกระงับ", confirmLabel: "ระงับบัญชี" }
                    : undefined
                }
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
