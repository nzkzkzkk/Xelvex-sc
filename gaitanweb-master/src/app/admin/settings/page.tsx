import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { db } from "@/lib/db";

export default async function AdminSettingsPage() {
  const settings = await db.storeSetting.findUnique({ where: { id: "default" } });

  return (
    <div>
      <AdminPageHeader title="ตั้งค่าร้าน" description="ชื่อร้าน ช่องทางติดต่อ และลิงก์ Discord" />
      <SettingsForm
        initial={{
          storeName: settings?.storeName ?? "Xelvex",
          supportEmail: settings?.supportEmail ?? "",
          discordUrl: settings?.discordUrl ?? "",
        }}
      />
    </div>
  );
}
