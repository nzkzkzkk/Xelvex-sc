"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageOff } from "lucide-react";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface GameOption {
  id: string;
  name: string;
}

export interface ProductFormValues {
  id?: string;
  gameId: string;
  title: string;
  subtitle: string;
  category: string;
  price: number;
  image: string;
  sortOrder: number;
  autoDelivery: boolean;
}

export function ProductForm({ games, initial }: { games: GameOption[]; initial?: ProductFormValues }) {
  const [values, setValues] = useState<ProductFormValues>(
    initial ?? { gameId: games[0]?.id ?? "", title: "", subtitle: "", category: "", price: 0, image: "", sortOrder: 0, autoDelivery: true }
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewBroken, setPreviewBroken] = useState(false);
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch(isEdit ? `/api/admin/products/${initial!.id}` : "/api/admin/products", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameId: values.gameId,
        title: values.title,
        subtitle: values.subtitle,
        category: values.category,
        price: Number(values.price),
        image: values.image.trim(),
        sortOrder: Number(values.sortOrder) || 0,
        autoDelivery: values.autoDelivery,
      }),
    });

    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "บันทึกไม่สำเร็จ");
      return;
    }

    router.push("/admin/products");
    router.refresh();
  }

  const previewSrc = values.image.trim();

  return (
    <div className="grid max-w-4xl grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">เกม</label>
            <select
              value={values.gameId}
              onChange={(e) => setValues((v) => ({ ...v, gameId: e.target.value }))}
              className="clip-x-sm h-11 w-full border border-border bg-surface-2 px-4 text-sm text-foreground outline-none focus:border-primary"
            >
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="ชื่อสินค้า"
            value={values.title}
            onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
            placeholder="Roblox Gift Card"
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="รายละเอียดย่อย (เช่น จำนวน ROBUX)"
              value={values.subtitle}
              onChange={(e) => setValues((v) => ({ ...v, subtitle: e.target.value }))}
              placeholder="500 ROBUX"
            />
            <Input
              label="หมวดหมู่ — ไม่บังคับ"
              value={values.category}
              onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
              placeholder="Robux, Blox Fruits, เพชร"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="ราคา (บาท)"
              type="number"
              min={1}
              value={values.price}
              onChange={(e) => setValues((v) => ({ ...v, price: Number(e.target.value) }))}
              required
            />
            <Input
              label="ลำดับการแสดง (น้อยขึ้นก่อน)"
              type="number"
              min={0}
              value={values.sortOrder}
              onChange={(e) => setValues((v) => ({ ...v, sortOrder: Number(e.target.value) }))}
            />
          </div>
          <Input
            label="รูปสินค้า — URL (https://...) หรือ path ในเว็บ (/products/xxx.jpg)"
            value={values.image}
            onChange={(e) => {
              setPreviewBroken(false);
              setValues((v) => ({ ...v, image: e.target.value }));
            }}
            placeholder="/products/roblox-common.jpg"
          />

          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={values.autoDelivery}
              onChange={(e) => setValues((v) => ({ ...v, autoDelivery: e.target.checked }))}
              className="h-4 w-4 rounded border-border-strong bg-surface-2 accent-primary"
            />
            จัดส่งอัตโนมัติ (Auto Delivery)
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "สร้างสินค้า"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push("/admin/products")}>
              ยกเลิก
            </Button>
            {isEdit && (
              <AdminActionButton
                className="ml-auto"
                variant="button"
                tone="danger"
                label="ลบสินค้า"
                request={{ url: `/api/admin/products/${initial!.id}`, method: "DELETE" }}
                redirectTo="/admin/products"
                confirm={{
                  title: "ลบสินค้านี้ถาวร?",
                  description: "สต๊อกที่ยังไม่ขายจะถูกลบไปด้วย ย้อนกลับไม่ได้ (ถ้ามีประวัติการสั่งซื้อจะลบไม่ได้ ให้ปิดขายแทน)",
                  confirmLabel: "ลบถาวร",
                }}
              />
            )}
          </div>
        </form>
      </Card>

      <Card className="h-fit p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-2">ตัวอย่างรูปสินค้า</p>
        <div className="clip-x-md relative aspect-square w-full overflow-hidden bg-surface-2">
          {previewSrc && !previewBroken ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-entered URL, preview only
            <img src={previewSrc} alt="ตัวอย่างรูปสินค้า" className="h-full w-full object-cover" onError={() => setPreviewBroken(true)} />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-2">
              <ImageOff className="h-6 w-6" />
              <span className="text-xs">{previewBroken ? "โหลดรูปไม่ได้ ตรวจสอบ URL" : "ยังไม่มีรูป"}</span>
            </div>
          )}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-2">
          แนะนำรูปสี่เหลี่ยมจัตุรัส (เช่น 800×800) วางไฟล์ไว้ในโฟลเดอร์ <code>public/products</code> แล้วใส่ path เช่น{" "}
          <code>/products/ชื่อไฟล์.jpg</code> หรือใช้ลิงก์รูปจากเว็บอื่นก็ได้
        </p>
      </Card>
    </div>
  );
}
