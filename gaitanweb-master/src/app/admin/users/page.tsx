import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { FilterPills } from "@/components/admin/FilterControls";
import { Table, THead, Th, TBody, Tr, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { getAdminUsers } from "@/lib/admin-queries";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; role?: string }>;
}) {
  const { q, page, role: roleParam } = await searchParams;
  const role = roleParam === "ADMIN" || roleParam === "CUSTOMER" ? roleParam : undefined;
  const [me, { rows: users, totalPages, page: currentPage, total }] = await Promise.all([
    getCurrentUser(),
    getAdminUsers({ q, page: page ? Number(page) : 1, role }),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="ผู้ใช้"
        description={`ทั้งหมด ${total} บัญชี`}
        searchPlaceholder="ค้นหาชื่อหรืออีเมล..."
        searchDefault={q}
        hiddenParams={{ role }}
        filters={
          <FilterPills
            name="role"
            value={role}
            options={[
              { value: "CUSTOMER", label: "ลูกค้า" },
              { value: "ADMIN", label: "แอดมิน" },
            ]}
          />
        }
      />

      {users.length === 0 ? (
        <EmptyState title="ไม่พบผู้ใช้" description={q || role ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง" : "ยังไม่มีผู้ใช้ในระบบ"} />
      ) : (
        <>
          <Table>
            <THead>
              <Th>ชื่อ</Th>
              <Th>อีเมล</Th>
              <Th>สิทธิ์</Th>
              <Th>ออเดอร์</Th>
              <Th>สถานะ</Th>
              <Th>สมัครเมื่อ</Th>
              <Th className="text-right">จัดการ</Th>
            </THead>
            <TBody>
              {users.map((u) => {
                const isMe = u.id === me?.id;
                return (
                  <Tr key={u.id}>
                    <Td primary>
                      <Link href={`/admin/users/${u.id}`} className="font-medium text-primary-soft hover:underline">
                        {u.displayName}
                      </Link>
                      {isMe && <span className="ml-1.5 text-[10px] text-muted-2">(คุณ)</span>}
                    </Td>
                    <Td label="อีเมล" className="text-muted">{u.email}</Td>
                    <Td label="สิทธิ์">
                      <Badge tone={u.role === "ADMIN" ? "primary" : "neutral"}>{u.role === "ADMIN" ? "แอดมิน" : "ลูกค้า"}</Badge>
                    </Td>
                    <Td label="ออเดอร์" className="text-muted">{u.orderCount}</Td>
                    <Td label="สถานะ">
                      <Badge tone={u.isActive ? "success" : "danger"}>{u.isActive ? "ใช้งานอยู่" : "ระงับ"}</Badge>
                    </Td>
                    <Td label="สมัครเมื่อ" className="whitespace-nowrap text-muted">{u.createdAt}</Td>
                    <Td actions className="text-right">
                      {!isMe && (
                        <div className="flex items-center justify-end gap-3">
                          <AdminActionButton
                            label={u.role === "ADMIN" ? "ถอดแอดมิน" : "ตั้งเป็นแอดมิน"}
                            request={{ url: `/api/admin/users/${u.id}`, body: { role: u.role === "ADMIN" ? "CUSTOMER" : "ADMIN" } }}
                            confirm={{
                              tone: "primary",
                              title: u.role === "ADMIN" ? `ถอดสิทธิ์แอดมินของ ${u.email}?` : `ตั้ง ${u.email} เป็นแอดมิน?`,
                              description:
                                u.role === "ADMIN"
                                  ? "บัญชีนี้จะเข้าหลังบ้านไม่ได้อีก"
                                  : "บัญชีนี้จะจัดการสินค้า สต๊อก ออเดอร์ และเห็นโค้ดทั้งหมดได้",
                              confirmLabel: u.role === "ADMIN" ? "ถอดสิทธิ์" : "ตั้งเป็นแอดมิน",
                            }}
                          />
                          <AdminActionButton
                            label={u.isActive ? "ระงับ" : "ยกเลิกระงับ"}
                            tone={u.isActive ? "danger" : "primary"}
                            request={{ url: `/api/admin/users/${u.id}`, body: { isActive: !u.isActive } }}
                            confirm={
                              u.isActive
                                ? { title: `ระงับบัญชี ${u.email}?`, description: "ผู้ใช้จะถูกออกจากระบบและเข้าสู่ระบบไม่ได้จนกว่าจะยกเลิกระงับ", confirmLabel: "ระงับบัญชี" }
                                : undefined
                            }
                          />
                        </div>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>

          <Pagination page={currentPage} totalPages={totalPages} basePath="/admin/users" query={{ q, role }} />
        </>
      )}
    </div>
  );
}
