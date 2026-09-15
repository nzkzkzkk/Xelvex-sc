"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DeliveryCodeReveal } from "@/components/marketplace/DeliveryCodeReveal";
import { requestJson } from "@/components/admin/AdminActionButton";

export function AdminCodeReveal({ orderNumber }: { orderNumber: string }) {
  const [items, setItems] = useState<{ title: string; code: string | null }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reveal() {
    setLoading(true);
    setError(null);
    try {
      const data = await requestJson(`/api/admin/orders/${orderNumber}/codes`, "GET");
      setItems(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  if (items) return <DeliveryCodeReveal items={items} />;

  return (
    <div className="flex flex-col gap-2">
      <Button variant="secondary" onClick={reveal} disabled={loading} className="w-full">
        <Eye className="h-4 w-4" />
        {loading ? "กำลังโหลด..." : "แสดงโค้ดของออเดอร์นี้"}
      </Button>
      <p className="text-xs text-muted-2">ใช้เมื่อลูกค้าทำโค้ดหาย — การเปิดดูจะถูกบันทึกในประวัติการทำรายการ</p>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
