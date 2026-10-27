import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { BoardView } from "@/features/operacional/missoes/components/board-view";
import { getArchivedCards, getBoardData } from "@/features/operacional/missoes/queries";

export const metadata: Metadata = { title: "Quadro · Missões" };

export default async function Page(props: PageProps<"/operacional/missoes/[boardId]">) {
  const { boardId } = await props.params;
  if (!z.uuid().safeParse(boardId).success) notFound();
  const [data, archived] = await Promise.all([getBoardData(boardId), getArchivedCards(boardId)]);
  if (!data) notFound();
  return <BoardView data={data} archived={archived} />;
}
