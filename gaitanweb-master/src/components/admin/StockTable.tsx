"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Eye } from "lucide-react";
import { AdminActionButton, requestJson } from "@/components/admin/AdminActionButton";
import { Table, THead, Th, TBody, Tr, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { StockStatus } from "@/types";

export interface StockRow {
  id: string;
  productTitle: string;
  maskedSecret: string;
  status: StockStatus;
  addedAt: string;
}

const TONE: Record<StockStatus, "success" | "warning" | "neutral" | "danger"> = {
  AVAILABLE: "success",
  RESERVED: "warning",
  SOLD: "neutral",
  DISABLED: "danger",
};

const LABEL: Record<StockStatus, string> = {
  AVAILABLE: "พร้อมขาย",
  RESERVED: "จองแล้ว",
  SOLD: "ขายแล้ว",
  DISABLED: "ปิดใช้งาน",
};

function RevealCode({ id }: { id: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function reveal() {
    setLoading(true);
    setError(null);
    try {
      const data = await requestJson(`/api/admin/stock/${id}`, "GET");
      setCode(data.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — text is still selectable
    }
  }

  if (code) {
    return (
      <span className="inline-flex items-center gap-2">
        <code className="select-all text-xs font-bold tracking-wider text-primary-soft">{code}</code>
        <button type="button" onClick={copy} aria-label="คัดลอก" className="text-muted-2 hover:text-foreground">
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </span>
    );
  }
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <button
        type="button"
        onClick={reveal}
        disabled={loading}
        title="เปิดดูโค้ด (บันทึกในประวัติการทำรายการ)"
        className="inline-flex items-center gap-1 text-xs text-muted-2 hover:text-foreground disabled:opacity-50"
      >
        <Eye className="h-3.5 w-3.5" /> {loading ? "..." : "ดูโค้ด"}
      </button>
      {error && <span className="text-[10px] text-danger">{error}</span>}
    </span>
  );
}

export function StockTable({ rows }: { rows: StockRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState<{ status: "AVAILABLE" | "DISABLED" } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const selectable = rows.filter((r) => r.status === "AVAILABLE" || r.status === "DISABLED");
  const allSelected = selectable.length > 0 && selectable.every((r) => selected.has(r.id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(selectable.map((r) => r.id)));
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
      await requestJson("/api/admin/stock", "PATCH", { ids: Array.from(selected), status: bulk.status });
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
            <Button size="sm" variant="secondary" onClick={() => setBulk({ status: "AVAILABLE" })} disabled={pending}>
              เปิดใช้งานที่เลือก
            </Button>
            <Button size="sm" variant="danger" onClick={() => setBulk({ status: "DISABLED" })} disabled={pending}>
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
          <Th>โค้ด</Th>
          <Th>สถานะ</Th>
          <Th>เพิ่มเมื่อ</Th>
          <Th className="text-right">จัดการ</Th>
        </THead>
        <TBody>
          {rows.map((item) => {
            const toggleable = item.status === "AVAILABLE" || item.status === "DISABLED";
            return (
              <Tr key={item.id} className={selected.has(item.id) ? "bg-primary/5" : undefined}>
                <Td check>
                  {toggleable && (
                    <input type="checkbox" aria-label="เลือก" checked={selected.has(item.id)} onChange={() => toggleOne(item.id)} className="h-4 w-4 accent-primary" />
                  )}
                </Td>
                <Td primary>{item.productTitle}</Td>
                <Td label="โค้ด">
                  <div className="flex items-center gap-3">
                    <code className="text-xs text-muted">{item.maskedSecret}</code>
                    <RevealCode id={item.id} />
                  </div>
                </Td>
                <Td label="สถานะ">
                  <Badge tone={TONE[item.status]}>{LABEL[item.status]}</Badge>
                </Td>
                <Td label="เพิ่มเมื่อ" className="whitespace-nowrap text-muted">{item.addedAt}</Td>
                <Td actions className="text-right">
                  {toggleable && (
                    <AdminActionButton
                      label={item.status === "AVAILABLE" ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                      tone={item.status === "AVAILABLE" ? "danger" : "primary"}
                      request={{ url: `/api/admin/stock/${item.id}`, body: { status: item.status === "AVAILABLE" ? "DISABLED" : "AVAILABLE" } }}
                    />
                  )}
                </Td>
              </Tr>
            );
          })}
        </TBody>
      </Table>

      <ConfirmDialog
        open={bulk !== null}
        pending={pending}
        tone={bulk?.status === "DISABLED" ? "danger" : "primary"}
        title={bulk?.status === "DISABLED" ? `ปิดใช้งานสต๊อก ${selected.size} รายการ?` : `เปิดใช้งานสต๊อก ${selected.size} รายการ?`}
        description={bulk?.status === "DISABLED" ? "โค้ดที่ปิดจะไม่ถูกจัดส่งให้ลูกค้า จนกว่าจะเปิดใหม่" : "โค้ดที่เลือกจะกลับมาพร้อมขาย"}
        confirmLabel={bulk?.status === "DISABLED" ? "ปิดใช้งาน" : "เปิดใช้งาน"}
        onConfirm={runBulk}
        onCancel={() => setBulk(null)}
      />
    </>
  );
}
