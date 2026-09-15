"use client";

import { useState, useEffect } from "react";
import {
  Boxes,
  Plus,
  Eye,
  EyeOff,
  Lock,
  Download,
  AlertTriangle,
  CheckCircle2,
  X,
  ShieldAlert,
} from "lucide-react";

interface StockRow {
  id: string;
  productId: string;
  productTitle: string;
  gameName: string;
  maskedSecret: string;
  status: string;
  createdAt: string;
}

interface ProductOption {
  id: string;
  title: string;
}

export default function StockPage() {
  const [items, setItems] = useState<StockRow[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Reveal state
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null);
  const [reauthPassword, setReauthPassword] = useState("");
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [revealError, setRevealError] = useState<string | null>(null);
  const [revealLoading, setRevealLoading] = useState(false);

  // Add stock state
  const [selectedProduct, setSelectedProduct] = useState("");
  const [rawItemsInput, setRawItemsInput] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccessMsg, setAddSuccessMsg] = useState<string | null>(null);

  // Export dual-control state
  const [exportReason, setExportReason] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  async function loadStock() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stock");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "โหลดข้อมูลสต็อกไม่สำเร็จ");
      setItems(data.items);
      setProducts(data.products);
      if (data.products.length > 0 && !selectedProduct) {
        setSelectedProduct(data.products[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStock();
  }, []);

  // Handle Reveal Secret with Re-authentication
  async function handleReveal(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStockId) return;

    setRevealLoading(true);
    setRevealError(null);

    try {
      const res = await fetch(`/api/admin/stock/${selectedStockId}/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: reauthPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "รหัสผ่านไม่ถูกต้อง");

      setRevealedSecret(data.secret);
    } catch (err: unknown) {
      setRevealError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการถอดรหัส");
    } finally {
      setRevealLoading(false);
    }
  }

  // Handle Add Encrypted Stock
  async function handleAddStock(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setError(null);

    try {
      const lines = rawItemsInput
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length === 0) {
        throw new Error("กรุณาระบุข้อมูลไอดีเกมหรือโค้ดอย่างน้อย 1 รายการ");
      }

      const res = await fetch("/api/admin/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct,
          items: lines,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เพิ่มสต็อกไม่สำเร็จ");

      setAddSuccessMsg(data.message);
      setRawItemsInput("");
      await loadStock();
      setTimeout(() => {
        setAddSuccessMsg(null);
        setShowAddModal(false);
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setAddLoading(false);
    }
  }

  // Handle Submit Dual-Control Stock Export
  async function handleExportRequest(e: React.FormEvent) {
    e.preventDefault();
    setExportLoading(true);
    try {
      const res = await fetch("/api/admin/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: "STOCK_EXPORT",
          title: "ส่งออกข้อมูลสต็อกไอดีเกมทั้งหมด (Stock Export)",
          description: exportReason || "ขอส่งออกข้อมูลสต็อกไอดีเกมเพื่อตรวจสอบความถูกต้อง",
          payload: { timestamp: new Date().toISOString() },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "สร้างคำขออนุมัติไม่สำเร็จ");

      setExportSuccessMsg("ส่งคำขออนุมัติแบบ Dual-Control เรียบร้อยแล้ว (รอแอดมินท่านอื่นพิจารณา)");
      setTimeout(() => {
        setExportSuccessMsg(null);
        setShowExportModal(false);
        setExportReason("");
      }, 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setExportLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-indigo-400" />
            การจัดการสต็อกไอดีเกม & รหัสเติมเงิน
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            เข้ารหัสระดับ Application Layer ด้วย AES-256-GCM • การดูรหัสต้องผ่านการยืนยันตัวตนซ้ำ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-amber-400" />
            ขอส่งออกสต็อก (Dual-Control)
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            เพิ่มสต็อกใหม่
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Stock Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">เกม / หมวดหมู่</th>
                <th className="p-4">ชื่อสินค้า</th>
                <th className="p-4">รหัส / ข้อมูลลับ (AES-256-GCM)</th>
                <th className="p-4">สถานะ</th>
                <th className="p-4">วันที่เพิ่ม</th>
                <th className="p-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    กำลังโหลดข้อมูลสต็อกที่เข้ารหัส...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    ยังไม่มีรายการสต็อกในระบบ
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/20 transition">
                    <td className="p-4 text-slate-300 font-semibold">{row.gameName}</td>
                    <td className="p-4 text-white">{row.productTitle}</td>
                    <td className="p-4 font-mono text-slate-400 tracking-wider">
                      <span className="p-1 px-2 rounded bg-slate-900 border border-slate-800 text-blue-300">
                        {row.maskedSecret}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          row.status === "AVAILABLE"
                            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                            : row.status === "SOLD"
                            ? "bg-slate-800 border border-slate-700 text-slate-400"
                            : "bg-red-500/10 border border-red-500/30 text-red-400"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-mono">
                      {new Date(row.createdAt).toLocaleDateString("th-TH")}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStockId(row.id);
                          setRevealedSecret(null);
                          setReauthPassword("");
                          setRevealError(null);
                          setShowRevealModal(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 text-xs border border-slate-700 transition inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        เปิดดูรหัส
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Reveal Secret (Re-authentication required) */}
      {showRevealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Lock className="w-4 h-4 text-blue-400" />
                ยืนยันตัวตนเพื่อดูรหัส (Re-authentication)
              </div>
              <button
                onClick={() => setShowRevealModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {revealError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {revealError}
              </div>
            )}

            {revealedSecret ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  ข้อมูลที่ถอดรหัสแล้ว (การเปิดดูนี้ถูกบันทึกใน Audit Log เรียบร้อยแล้ว):
                </p>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-sm text-emerald-300 select-all break-all">
                  {revealedSecret}
                </div>
                <button
                  type="button"
                  onClick={() => setShowRevealModal(false)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            ) : (
              <form onSubmit={handleReveal} className="space-y-4">
                <p className="text-xs text-slate-400">
                  เพื่อความปลอดภัยตามมาตรฐาน Security Policy กรุณากรอกรหัสผ่านของคุณเพื่อยืนยันตัวตนก่อนถอดรหัส
                </p>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    รหัสผ่านแอดมินของคุณ
                  </label>
                  <input
                    type="password"
                    required
                    autoFocus
                    value={reauthPassword}
                    onChange={(e) => setReauthPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRevealModal(false)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={revealLoading || !reauthPassword}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-blue-600/20"
                  >
                    {revealLoading ? "กำลังตรวจสอบ..." : "ยืนยันและถอดรหัส"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Encrypted Stock */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Plus className="w-4 h-4 text-emerald-400" />
                เพิ่มสต็อกสินค้า (เข้ารหัสอัตโนมัติ)
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {addSuccessMsg}
              </div>
            )}

            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  เลือกสินค้า
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  รหัส / ข้อมูลไอดีเกม (1 บรรทัด = 1 ชิ้น)
                </label>
                <textarea
                  required
                  rows={6}
                  value={rawItemsInput}
                  onChange={(e) => setRawItemsInput(e.target.value)}
                  placeholder={`ตัวอย่าง:\nusername:password\nRBLX-1234-5678-90AB\nFF-ABCD-EFGH-IJKL`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                />
                <span className="text-[11px] text-slate-500">
                  ระบบจะทำการเข้ารหัสด้วย AES-256-GCM ทันทีที่กดบันทึก ข้อมูลจะไม่ถูกบันทึกเป็น Plaintext
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={addLoading || !rawItemsInput}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-emerald-600/20"
                >
                  {addLoading ? "กำลังเข้ารหัสและบันทึก..." : "บันทึกสต็อกที่เข้ารหัส"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Export Stock (Dual-Control Request) */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Download className="w-4 h-4 text-amber-400" />
                คำขอส่งออกสต็อก (Two-Person Rule)
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {exportSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                {exportSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleExportRequest} className="space-y-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
                  <span className="font-semibold block mb-1">การควบคุมความเสี่ยงสูง (Dual-Control):</span>
                  การ Export สต็อกทั้งหมดเป็นการกระทำที่มีความเสี่ยง คำขอนี้จะต้องได้รับการอนุมัติจากผู้ดูแลระบบท่านอื่นก่อนดำเนินการ
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    เหตุผลความจำเป็นในการส่งออก
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={exportReason}
                    onChange={(e) => setExportReason(e.target.value)}
                    placeholder="เช่น เพื่อตรวจสอบยอดคงเหลือประจำสัปดาห์ร่วมกับฝ่ายบัญชี..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowExportModal(false)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={exportLoading || !exportReason}
                    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-amber-600/20"
                  >
                    {exportLoading ? "กำลังส่งคำขอ..." : "ส่งคำขอไปยังฝ่ายอนุมัติ"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
