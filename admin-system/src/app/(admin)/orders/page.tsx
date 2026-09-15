"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Search, Filter, Clock } from "lucide-react";

interface OrderRow {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  totalAmount: number;
  status: string;
  paymentMethod: string | null;
  items: { id: string; title: string; unitPrice: number }[];
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    setLoading(true);
    try {
      const url = statusFilter ? `/api/admin/orders?status=${statusFilter}` : "/api/admin/orders";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setOrders(data.orders);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-teal-400" />
            รายการคำสั่งซื้อ (Orders Management)
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            ติดตามสถานะคำสั่งซื้อ ตรวจสอบการชำระเงิน และประวัติการจัดส่งอัตโนมัติ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="">ทั้งหมดทุกสถานะ</option>
            <option value="DELIVERED">จัดส่งแล้ว (DELIVERED)</option>
            <option value="PENDING_PAYMENT">รอชำระเงิน (PENDING_PAYMENT)</option>
            <option value="PROCESSING">กำลังประมวลผล (PROCESSING)</option>
            <option value="FAILED">ล้มเหลว (FAILED)</option>
          </select>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">เลขที่คำสั่งซื้อ</th>
                <th className="p-4">ลูกค้า</th>
                <th className="p-4">รายการสินค้า</th>
                <th className="p-4">ยอดชำระ</th>
                <th className="p-4">วิธีชำระ</th>
                <th className="p-4">สถานะ</th>
                <th className="p-4">เวลา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    กำลังโหลดข้อมูลคำสั่งซื้อ...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    ไม่พบคำสั่งซื้อ
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/20 transition">
                    <td className="p-4 font-mono font-bold text-white">{order.orderNumber}</td>
                    <td className="p-4">
                      <div className="text-slate-200">{order.customerName}</div>
                      <div className="text-slate-500 font-mono text-[11px]">{order.customerEmail}</div>
                    </td>
                    <td className="p-4 text-slate-300">
                      {order.items.map((i) => i.title).join(", ") || "-"}
                    </td>
                    <td className="p-4 font-mono font-bold text-emerald-400">
                      ฿{order.totalAmount.toLocaleString("th-TH")}
                    </td>
                    <td className="p-4 font-mono text-slate-400 uppercase text-[11px]">
                      {order.paymentMethod || "standard"}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.status === "DELIVERED"
                            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                            : order.status === "PENDING_PAYMENT"
                            ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                            : "bg-red-500/10 border border-red-500/30 text-red-400"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-mono">
                      {new Date(order.createdAt).toLocaleString("th-TH")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
