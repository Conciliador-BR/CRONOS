import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { BoardOption } from "./resolve";

/** Quadros e listas visíveis ao usuário logado (RLS), só nomes e IDs. Limite: o que vai ao modelo. */
export async function getAgentBoards(): Promise<BoardOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("boards")
    .select("id, name, board_lists(id, name, position)")
    .order("position")
    .order("position", { referencedTable: "board_lists" })
    .limit(100)
    .limit(30, { referencedTable: "board_lists" });
  if (error) throw new Error("Falha ao carregar quadros");
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    lists: row.board_lists.map((list) => ({ id: list.id, name: list.name })),
  }));
}

/** Nomes do quadro e da lista, confirmando que a lista pertence ao quadro. null se não existir. */
export async function findBoardList(boardId: string, listId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("board_lists")
    .select("name, boards(name)")
    .eq("id", listId)
    .eq("board_id", boardId)
    .maybeSingle();
  return data?.boards ? { boardName: data.boards.name, listName: data.name } : null;
}

export async function companyExists(cnpj: string) {
  const supabase = await createClient();
  const { count } = await supabase.from("companies").select("id", { count: "exact", head: true }).eq("cnpj", cnpj);
  return Boolean(count);
}
