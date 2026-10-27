import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { BoardsGrid } from "@/features/operacional/missoes/components/boards-grid";
import { MissionsBackdrop, WallpaperButton } from "@/features/operacional/missoes/components/missions-wallpaper";
import { getBoards, getMissionsWallpaper } from "@/features/operacional/missoes/queries";

export const metadata: Metadata = { title: "Missões" };

export default async function Page() {
  const [boards, wallpaper] = await Promise.all([getBoards(), getMissionsWallpaper()]);
  return (
    <MissionsBackdrop image={wallpaper}>
      <PageHeader
        title="Missões"
        description="Quadros da equipe no estilo Trello: listas, cartões, responsáveis e prazos."
      >
        <WallpaperButton image={wallpaper} />
      </PageHeader>
      <h2 className="mb-3 text-sm font-semibold text-muted">Seus quadros</h2>
      <BoardsGrid boards={boards} />
    </MissionsBackdrop>
  );
}
