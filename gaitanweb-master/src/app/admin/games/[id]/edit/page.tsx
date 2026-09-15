import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { GameForm } from "@/components/admin/GameForm";
import { db } from "@/lib/db";

export default async function EditGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = await db.game.findUnique({ where: { id } });
  if (!game) notFound();

  return (
    <div>
      <AdminPageHeader title="แก้ไขเกม" description={game.name} />
      <GameForm initial={{ id: game.id, name: game.name, slug: game.slug, coverImage: game.coverImage ?? "" }} />
    </div>
  );
}
