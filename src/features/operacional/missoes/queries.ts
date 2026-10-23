import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getActiveMembers } from "../shared/members";
import type { BoardCard, BoardData, BoardDestination, BoardSummary } from "./types";

/** Quadros com contagem de listas e cartões ativos. */
export async function getBoards(): Promise<BoardSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("boards")
    .select("id, name, background, position, created_at, board_lists(count), cards(count)")
    .eq("cards.archived", false)
    .order("position")
    .order("created_at");
  if (error) throw new Error("Falha ao carregar quadros");
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    background: row.background,
    listCount: row.board_lists[0]?.count ?? 0,
    cardCount: row.cards[0]?.count ?? 0,
  }));
}

async function getDestinations(): Promise<BoardDestination[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("boards")
    .select("id, name, position, board_lists(id, name, position)")
    .order("position")
    .order("position", { referencedTable: "board_lists" });
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    lists: row.board_lists.map((list) => ({ id: list.id, name: list.name })),
  }));
}

/** Tudo o que a tela do quadro precisa, em consultas paralelas. null se não existir. */
export async function getBoardData(boardId: string): Promise<BoardData | null> {
  const supabase = await createClient();
  const [boardRes, listsRes, cardsRes, labelsRes, members, destinations] = await Promise.all([
    supabase.from("boards").select("id, name, background").eq("id", boardId).maybeSingle(),
    supabase.from("board_lists").select("id, name, position").eq("board_id", boardId).order("position"),
    supabase
      .from("cards")
      .select(
        "id, list_id, title, description, due_at, completed, position, card_labels(label_id), card_assignees(profile_id), card_checklist_items(id, content, done, position)",
      )
      .eq("board_id", boardId)
      .eq("archived", false)
      .order("position"),
    supabase.from("labels").select("id, name, color").eq("board_id", boardId).order("created_at"),
    getActiveMembers(),
    getDestinations(),
  ]);
  if (boardRes.error || listsRes.error || cardsRes.error || labelsRes.error) {
    throw new Error("Falha ao carregar o quadro");
  }
  if (!boardRes.data) return null;

  const cards: BoardCard[] = (cardsRes.data ?? []).map((row) => ({
    id: row.id,
    listId: row.list_id,
    title: row.title,
    description: row.description ?? "",
    dueAt: row.due_at,
    completed: row.completed,
    position: row.position,
    labelIds: row.card_labels.map((item) => item.label_id),
    assigneeIds: row.card_assignees.map((item) => item.profile_id),
    checklist: row.card_checklist_items.toSorted((a, b) => a.position - b.position),
  }));

  return {
    board: boardRes.data,
    lists: listsRes.data ?? [],
    cards,
    labels: labelsRes.data ?? [],
    members,
    destinations,
  };
}

/** Cartões arquivados do quadro (para restaurar). */
export async function getArchivedCards(boardId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cards")
    .select("id, title, updated_at")
    .eq("board_id", boardId)
    .eq("archived", true)
    .order("updated_at", { ascending: false })
    .limit(100);
  return (data ?? []).map((row) => ({ id: row.id, title: row.title, archivedAt: row.updated_at }));
}
