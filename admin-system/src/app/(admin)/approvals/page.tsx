"use client";

import { useState, useEffect } from "react";
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  AlertTriangle,
  User,
  X,
} from "lucide-react";

interface ApprovalItem {
  id: string;
  actionType: string;
  title: string;
  description: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  requestedBy: { id: string; username: string; displayName: string; role: string };
  reviewedBy: { id: string; username: string; displayName: string; role: string } | null;
  reviewNote: string | null;
  canReview: boolean;
  executedAt: string | null;
  createdAt: string;
}

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"PENDING" | "ALL">("PENDING");

  // Review Modal State
  const [selectedReq, setSelectedReq] = useState<ApprovalItem | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewNote, setReviewNote] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function loadApprovals() {
    setLoading(true);
    try {
      const url = activeTab === "PENDING" ? "/api/admin/approvals?status=PENDING" : "/api/admin/approvals";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setRequests(data.requests);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApprovals();
  }, [activeTab]);

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedReq) return;

    setReviewLoading(true);
    try {
      const res = await fetch(`/api/admin/approvals/${selectedReq.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: reviewDecision,
          reviewNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการพิจารณา");

      setMessage(data.message);
      setSelectedReq(null);
      setReviewNote("");
      await loadApprovals();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setReviewLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-amber-400" />
            การอนุมัติแบบ Dual-Control (Two-Person Rule)
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            ป้องกันคำสั่งความเสี่ยงสูง • ห้ามผู้สร้างคำขออนุมัติรายการของตนเอง (Self-Approval Blocked)
          </p>
        </div>

        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("PENDING")}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition ${
              activeTab === "PENDING"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            รอพิจารณา
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition ${
              activeTab === "ALL"
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ประวัติทั้งหมด
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {message}
        </div>
      )}

      {/* Dual-Control Policy Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border border-amber-800/40 text-xs text-amber-300 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
        <div>
          <span className="font-semibold block text-white mb-0.5">Dual-Control Security Policy:</span>
          คำสั่งใด ๆ ที่มีผลกระทบร้ายแรง เช่น การ Export ข้อมูลสต็อกไอดีเกมทั้งหมด, การสร้างหรือยกระดับสิทธิ์เป็น SUPER_ADMIN, หรือการถอนเงินจำนวนมาก จะถูกพักไว้ที่นี่จนกว่าแอดมินอีกบุคคลหนึ่งจะตรวจสอบและให้ความเห็นชอบ
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500 glass-panel rounded-2xl border border-slate-800">
            กำลังโหลดรายการคำขอ...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500 glass-panel rounded-2xl border border-slate-800">
            ไม่มีคำขออนุมัติในหมวดหมู่นี้
          </div>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 border border-blue-500/30 text-blue-300">
                    {req.actionType}
                  </span>
                  <h3 className="text-sm font-semibold text-white">{req.title}</h3>
                </div>

                {req.description && (
                  <p className="text-slate-400 text-xs">{req.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-slate-500 text-[11px] pt-1">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    ผู้ขอ: <strong className="text-slate-300">{req.requestedBy.displayName}</strong> ({req.requestedBy.role})
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(req.createdAt).toLocaleString("th-TH")}
                  </span>
                  {req.reviewedBy && (
                    <span className="text-emerald-400">
                      พิจารณาโดย: <strong>{req.reviewedBy.displayName}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Status & Review Action */}
              <div className="flex items-center gap-3 shrink-0">
                {req.status === "PENDING" ? (
                  req.canReview ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReq(req);
                        setReviewDecision("APPROVED");
                        setReviewNote("");
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
                    >
                      <FileCheck2 className="w-4 h-4" />
                      พิจารณาคำขอ
                    </button>
                  ) : (
                    <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-[11px] flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      คุณเป็นผู้สร้าง (ห้ามอนุมัติตนเอง)
                    </div>
                  )
                ) : (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      req.status === "APPROVED"
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                        : "bg-red-500/10 border border-red-500/30 text-red-400"
                    }`}
                  >
                    {req.status}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Dialog Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <FileCheck2 className="w-4 h-4 text-amber-400" />
                พิจารณาคำขอแบบ Dual-Control
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <p className="font-semibold text-white">{selectedReq.title}</p>
              <p className="text-slate-400">{selectedReq.description}</p>
              <p className="text-[11px] text-amber-400 pt-1">
                ผู้ยื่นคำขอ: {selectedReq.requestedBy.displayName} ({selectedReq.requestedBy.username})
              </p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  การตัดสินใจของคุณ
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewDecision("APPROVED")}
                    className={`py-2.5 rounded-xl font-semibold text-xs border transition flex items-center justify-center gap-1.5 ${
                      reviewDecision === "APPROVED"
                        ? "bg-emerald-600/20 border-emerald-500 text-emerald-300"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    อนุมัติคำขอ
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewDecision("REJECTED")}
                    className={`py-2.5 rounded-xl font-semibold text-xs border transition flex items-center justify-center gap-1.5 ${
                      reviewDecision === "REJECTED"
                        ? "bg-red-600/20 border-red-500 text-red-300"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-red-400" />
                    ปฏิเสธคำขอ
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  หมายเหตุการพิจารณา (จะถูกบันทึกใน Audit Log)
                </label>
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="เช่น ตรวจสอบความจำเป็นแล้ว อนุมัติให้ดำเนินการได้..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className={`flex-1 py-2.5 text-white rounded-xl text-xs font-semibold transition shadow-lg ${
                    reviewDecision === "APPROVED"
                      ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                      : "bg-red-600 hover:bg-red-500 shadow-red-600/20"
                  }`}
                >
                  {reviewLoading ? "กำลังบันทึก..." : `ยืนยันการ${reviewDecision === "APPROVED" ? "อนุมัติ" : "ปฏิเสธ"}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
