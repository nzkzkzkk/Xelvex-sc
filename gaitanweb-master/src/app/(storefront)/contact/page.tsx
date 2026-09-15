import { Clock, MessageCircle, ShieldAlert } from "lucide-react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { STORE_NAME } from "@/lib/site-config";

const CHANNELS = [
  {
    icon: MessageCircle,
    title: "Discord",
    desc: "ช่องทางหลักสำหรับสอบถามและแจ้งปัญหาการสั่งซื้อ",
    status: "เร็วๆ นี้",
  },
  {
    icon: Clock,
    title: "เวลาตอบกลับ",
    desc: "ทีมงานตอบกลับภายใน 24 ชั่วโมงในวันทำการ",
    status: null,
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: "หน้าแรก", href: "/" }, { label: "ติดต่อเรา" }]} />
      <h1 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">ติดต่อเรา</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        มีคำถามเกี่ยวกับคำสั่งซื้อ สินค้า หรือเว็บ {STORE_NAME}? ทักมาได้ตามช่องทางด้านล่าง
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CHANNELS.map(({ icon: Icon, title, desc, status }) => (
          <Card key={title} brackets className="p-6">
            <div className="flex items-center justify-between">
              <div className="clip-x-sm flex h-11 w-11 items-center justify-center bg-primary/10 text-primary-strong">
                <Icon className="h-5 w-5" />
              </div>
              {status && <Badge tone="warning">{status}</Badge>}
            </div>
            <h3 className="mt-4 text-sm font-bold text-foreground">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{desc}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6 flex items-start gap-3 p-5">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <p className="text-sm leading-relaxed text-muted">
          เมื่อแจ้งปัญหาเกี่ยวกับคำสั่งซื้อ กรุณาแนบ{" "}
          <span className="text-foreground">หมายเลขคำสั่งซื้อ</span> (ดูได้จากหน้า My
          Orders) เพื่อให้ทีมงานตรวจสอบได้เร็วขึ้น
        </p>
      </Card>
    </div>
  );
}
