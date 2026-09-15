import { ChevronDown } from "lucide-react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { STORE_NAME } from "@/lib/site-config";

const FAQS = [
  {
    q: "ได้รับสินค้าหลังชำระเงินนานแค่ไหน?",
    a: `ระบบส่งสินค้าอัตโนมัติทันทีที่การชำระเงินได้รับการยืนยัน ปกติจะเห็นโค้ด/คีย์ในหน้า My Orders ภายในไม่กี่วินาที ไม่ต้องรอแอดมินกดส่งเอง`,
  },
  {
    q: "สินค้าที่ขายคืออะไร ปลอดภัยแค่ไหน?",
    a: `${STORE_NAME} จำหน่ายกิฟต์การ์ด/โค้ด/คีย์ดิจิทัลที่ได้รับมาถูกต้องตามช่องทางที่อนุญาต ไม่ใช่การเติมเงินเข้าบัญชีโดยตรงหรือใช้บอทใด ๆ โค้ดแต่ละชุดจะถูกล็อกให้คำสั่งซื้อเดียวเท่านั้น จึงไม่มีทางถูกขายซ้ำ`,
  },
  {
    q: "ถ้าโค้ดใช้ไม่ได้ต้องทำยังไง?",
    a: "ติดต่อทีมงานผ่านช่องทางในหน้าติดต่อเรา พร้อมแจ้งหมายเลขคำสั่งซื้อ ทีมงานจะตรวจสอบและดำเนินการแก้ไขให้โดยเร็วที่สุด",
  },
  {
    q: "ต้องสมัครสมาชิกก่อนซื้อของไหม?",
    a: "ต้องสมัครสมาชิกก่อน เพื่อให้คุณสามารถติดตามคำสั่งซื้อและดูโค้ดที่ได้รับย้อนหลังได้จากหน้า My Orders",
  },
  {
    q: "ช่องทางชำระเงินตอนนี้มีอะไรบ้าง?",
    a: "ระบบชำระเงินกำลังอยู่ระหว่างการพัฒนาและเชื่อมต่อช่องทางจริง จะประกาศให้ทราบอีกครั้งเมื่อเปิดใช้งาน",
  },
  {
    q: "ราคาที่เห็นตอนเลือกซื้อ เปลี่ยนแปลงได้ไหม?",
    a: "ราคาที่ต้องจ่ายจริงคำนวณจากฐานข้อมูลฝั่งเซิร์ฟเวอร์ตอนสร้างคำสั่งซื้อเสมอ เพื่อป้องกันการปลอมแปลงราคาจากฝั่งผู้ใช้",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: "หน้าแรก", href: "/" }, { label: "FAQ" }]} />
      <h1 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
        คำถามที่พบบ่อย
      </h1>
      <p className="mt-2 text-sm text-muted">
        ยังหาคำตอบไม่เจอ? ติดต่อทีมงานได้ที่{" "}
        <a href="/contact" className="text-primary-soft hover:underline">
          หน้าติดต่อเรา
        </a>
      </p>

      <div className="mt-8 flex flex-col gap-3">
        {FAQS.map(({ q, a }) => (
          <details
            key={q}
            className="clip-x-md group border border-border bg-surface open:border-border-strong"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-foreground marker:content-none">
              {q}
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-2 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <p className="px-5 pb-4 text-sm leading-relaxed text-muted">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
