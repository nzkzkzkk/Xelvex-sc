import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { GameForm } from "@/components/admin/GameForm";

export default function NewGamePage() {
  return (
    <div>
      <AdminPageHeader title="เพิ่มเกม" description="เพิ่มเกมใหม่เข้าระบบ" />
      <GameForm />
    </div>
  );
}
