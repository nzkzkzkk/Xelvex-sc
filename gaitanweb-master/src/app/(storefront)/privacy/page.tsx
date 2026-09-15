import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { STORE_NAME } from "@/lib/site-config";

const SECTIONS = [
  {
    title: "1. ข้อมูลที่เราเก็บ",
    body: "ชื่อผู้ใช้ อีเมล และรหัสผ่านที่เข้ารหัสแล้ว (ไม่เก็บรหัสผ่านต้นฉบับ) รวมถึงประวัติคำสั่งซื้อ เพื่อให้ระบบทำงานได้ถูกต้อง",
  },
  {
    title: "2. วิธีที่เราใช้ข้อมูล",
    body: `ข้อมูลของคุณถูกใช้เพื่อดำเนินการคำสั่งซื้อ ยืนยันตัวตนเข้าสู่ระบบ และปรับปรุงบริการของ ${STORE_NAME} เท่านั้น เราไม่นำข้อมูลไปขายหรือแบ่งปันให้บุคคลที่สามเพื่อการตลาด`,
  },
  {
    title: "3. ความปลอดภัยของข้อมูล",
    body: "รหัสผ่านถูกเข้ารหัสก่อนจัดเก็บ การเข้าสู่ระบบใช้เซสชันที่มีอายุจำกัด และคำสั่งซื้อของแต่ละบัญชีจะมองเห็นได้เฉพาะเจ้าของบัญชีเท่านั้น",
  },
  {
    title: "4. สิทธิ์ของคุณ",
    body: "คุณสามารถขอให้ทีมงานลบบัญชีหรือข้อมูลส่วนตัวของคุณได้ โดยติดต่อผ่านช่องทางในหน้าติดต่อเรา",
  },
  {
    title: "5. คุกกี้และเซสชัน",
    body: "เว็บไซต์ใช้คุกกี้เพื่อจดจำสถานะการเข้าสู่ระบบเท่านั้น ไม่ใช้คุกกี้เพื่อการติดตามโฆษณา",
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: "หน้าแรก", href: "/" }, { label: "Privacy" }]} />
      <h1 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
        นโยบายความเป็นส่วนตัว
      </h1>
      <p className="mt-2 text-sm text-muted">ปรับปรุงล่าสุด: กันยายน 2026</p>

      <div className="mt-8 flex flex-col gap-6">
        {SECTIONS.map(({ title, body }) => (
          <div key={title}>
            <h2 className="text-sm font-bold text-foreground">{title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
