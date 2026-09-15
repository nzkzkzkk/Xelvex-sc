import Image from "next/image";
import Link from "next/link";
import { Gamepad2, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { Table, THead, Th, TBody, Tr, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getAdminGames } from "@/lib/admin-queries";

export default async function AdminGamesPage() {
  const games = await getAdminGames();

  return (
    <div>
      <AdminPageHeader
        title="เกม"
        description={`ทั้งหมด ${games.length} เกม`}
        action={
          <Link href="/admin/games/new">
            <Button size="sm">
              <Plus className="h-4 w-4" /> เพิ่มเกม
            </Button>
          </Link>
        }
      />

      {games.length === 0 ? (
        <EmptyState icon={Gamepad2} title="ยังไม่มีเกม" description="เพิ่มเกมแรกเพื่อเริ่มสร้างสินค้า" />
      ) : (
        <Table>
          <THead>
            <Th>เกม</Th>
            <Th>Slug</Th>
            <Th>จำนวนสินค้า</Th>
            <Th>สถานะ</Th>
            <Th className="text-right">จัดการ</Th>
          </THead>
          <TBody>
            {games.map((g) => (
              <Tr key={g.id}>
                <Td primary>
                  <div className="flex items-center gap-3">
                    <div className="clip-x-sm relative h-11 w-11 shrink-0 overflow-hidden bg-surface-2">
                      {g.coverImage ? (
                        <Image src={g.coverImage} alt="" fill sizes="44px" className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-2">
                          <Gamepad2 className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <span className="font-medium">{g.name}</span>
                  </div>
                </Td>
                <Td label="Slug" className="text-muted">{g.slug}</Td>
                <Td label="จำนวนสินค้า">
                  <Link href={`/admin/products?game=${g.id}`} className="text-primary-soft hover:underline">
                    {g.productCount} รายการ
                  </Link>
                </Td>
                <Td label="สถานะ">
                  <Badge tone={g.isActive ? "success" : "neutral"}>{g.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}</Badge>
                </Td>
                <Td actions className="text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/admin/games/${g.id}/edit`} className="text-xs font-medium text-primary-soft hover:underline">
                      แก้ไข
                    </Link>
                    <AdminActionButton
                      label={g.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                      tone={g.isActive ? "danger" : "primary"}
                      request={{ url: `/api/admin/games/${g.id}`, body: { isActive: !g.isActive } }}
                      confirm={
                        g.isActive
                          ? {
                              title: `ปิดใช้งาน "${g.name}"?`,
                              description: "เกมและสินค้าทั้งหมดในเกมนี้จะหายจากหน้าร้าน เปิดใหม่ได้ทุกเมื่อ",
                              confirmLabel: "ปิดใช้งาน",
                            }
                          : undefined
                      }
                    />
                    <AdminActionButton
                      label="ลบ"
                      tone="danger"
                      request={{ url: `/api/admin/games/${g.id}`, method: "DELETE" }}
                      confirm={{
                        title: `ลบ "${g.name}" ถาวร?`,
                        description: "ลบได้เฉพาะเกมที่ไม่มีสินค้าอยู่ ย้อนกลับไม่ได้",
                        confirmLabel: "ลบถาวร",
                      }}
                    />
                  </div>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
