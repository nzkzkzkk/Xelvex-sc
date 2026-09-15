"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageOff } from "lucide-react";
import { AdminActionButton, requestJson } from "@/components/admin/AdminActionButton";
import { Table, THead, Th, TBody, Tr, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatTHB } from "@/lib/utils";

export interface ProductRow {
  id: string;
  title: string;
  subtitle: string | null;
  category: string | null;
  gameName: string;
  price: number;
  image: string | null;
  stockCount: number;
  isActive: boolean;
}

export function ProductsTable({ rows }: { rows: ProductRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState<{ isActive: boolean } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function runBulk() {
    if (!bulk) return;
    setPending(true);
    setError(null);
    try {
      await requestJson("/api/admin/products/bulk", "PATCH", { ids: Array.from(selected), isActive: bulk.isActive });
      setSelected(new Set());
      setBulk(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {selected.size > 0 && (
        <div className="clip-x-sm mb-3 flex flex-wrap items-center gap-3 border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm">
          <span className="font-semibold text-primary-soft">เลือกแล้ว {selected.size} รายการ</span>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setBulk({ isActive: true })} disabled={pending}>
              เปิดใช้งานที่เลือก
            </Button>
            <Button size="sm" variant="danger" onClick={() => setBulk({ isActive: false })} disabled={pending}>
              ปิดใช้งานที่เลือก
            </Button>
            <button type="button" onClick={() => setSelected(new Set())} className="text-xs text-muted hover:text-foreground">
              ยกเลิกการเลือก
            </button>
          </div>
          {error && <span className="text-xs text-danger">{error}</span>}
        </div>
      )}

      <Table>
        <THead>
          <Th className="w-10">
            <input type="checkbox" aria-label="เลือกทั้งหมด" checked={allSelected} onChange={toggleAll} className="h-4 w-4 accent-primary" />
          </Th>
          <Th>สินค้า</Th>
          <Th>เกม</Th>
          <Th>ราคา</Th>
          <Th>สต๊อก</Th>
          <Th>สถานะ</Th>
          <Th className="text-right">จัดการ</Th>
        </THead>
        <TBody>
          {rows.map((p) => (
            <Tr key={p.id} className={selected.has(p.id) ? "bg-primary/5" : undefined}>
              <Td check>
                <input type="checkbox" aria-label={`เลือก ${p.title}`} checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} className="h-4 w-4 accent-primary" />
              </Td>
              <Td primary>
                <div className="flex items-center gap-3">
                  <div className="clip-x-sm relative h-11 w-11 shrink-0 overflow-hidden bg-surface-2">
                    {p.image ? (
                      <Image src={p.image} alt="" fill sizes="44px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-2">
                        <ImageOff className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-muted">
                      {p.subtitle}
                      {p.category && <span className="text-muted-2"> · {p.category}</span>}
                    </p>
                  </div>
                </div>
              </Td>
              <Td label="เกม" className="text-muted">{p.gameName}</Td>
              <Td label="ราคา" className="font-semibold">{formatTHB(p.price)}</Td>
              <Td label="สต๊อก">
                <Badge tone={p.stockCount === 0 ? "danger" : p.stockCount <= 10 ? "warning" : "neutral"}>{p.stockCount}</Badge>
              </Td>
              <Td label="สถานะ">
                <Badge tone={p.isActive ? "success" : "neutral"}>{p.isActive ? "เปิดขาย" : "ปิดขาย"}</Badge>
              </Td>
              <Td actions className="text-right">
                <div className="flex items-center justify-end gap-3">
                  <Link href={`/admin/products/${p.id}/edit`} className="text-xs font-medium text-primary-soft hover:underline">
                    แก้ไข
                  </Link>
                  <AdminActionButton
                    label={p.isActive ? "ปิดขาย" : "เปิดขาย"}
                    tone={p.isActive ? "danger" : "primary"}
                    request={{ url: `/api/admin/products/${p.id}`, body: { isActive: !p.isActive } }}
                    confirm={
                      p.isActive
                        ? { title: `ปิดขาย "${p.title} ${p.subtitle ?? ""}"?`, description: "สินค้าจะหายจากหน้าร้านทันที แต่ข้อมูลและสต๊อกยังอยู่ เปิดขายใหม่ได้ทุกเมื่อ", confirmLabel: "ปิดขาย" }
                        : undefined
                    }
                  />
                  <AdminActionButton
                    label="ลบ"
                    tone="danger"
                    request={{ url: `/api/admin/products/${p.id}`, method: "DELETE" }}
                    confirm={{
                      title: `ลบ "${p.title} ${p.subtitle ?? ""}" ถาวร?`,
                      description: "สต๊อกที่ยังไม่ขายของสินค้านี้จะถูกลบไปด้วย ย้อนกลับไม่ได้ (ลบไม่ได้ถ้ามีประวัติการสั่งซื้อ)",
                      confirmLabel: "ลบถาวร",
                    }}
                  />
                </div>
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>

      <ConfirmDialog
        open={bulk !== null}
        pending={pending}
        tone={bulk?.isActive ? "primary" : "danger"}
        title={bulk?.isActive ? `เปิดขาย ${selected.size} รายการ?` : `ปิดขาย ${selected.size} รายการ?`}
        description={bulk?.isActive ? "สินค้าที่เลือกจะกลับมาแสดงบนหน้าร้าน" : "สินค้าที่เลือกจะหายจากหน้าร้านทันที"}
        confirmLabel={bulk?.isActive ? "เปิดขาย" : "ปิดขาย"}
        onConfirm={runBulk}
        onCancel={() => setBulk(null)}
      />
    </>
  );
}
