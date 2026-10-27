import "server-only";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { wallParts } from "./shared/tz";

/**
 * Consultas do Operacional reaproveitadas por outros módulos (ex.: Início).
 * Assinaturas estáveis: documente qualquer mudança no README.
 */

export type UpcomingEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  color: string;
  location: string | null;
  meetingUrl: string | null;
  /** Link para a agenda no dia do evento. */
  href: string;
};

export type MyOpenCard = {
  id: string;
  title: string;
  dueAt: string | null;
  boardId: string;
  boardName: string;
  listName: string;
  /** Link para o quadro do cartão. */
  href: string;
};

const clampLimit = (limit: number) => Math.max(1, Math.min(Math.trunc(limit) || 1, 50));

/** Próximas reuniões da equipe (que ainda não terminaram), em ordem de início. */
export async function getUpcomingEvents(limit: number): Promise<UpcomingEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, title, starts_at, ends_at, all_day, color, location, meeting_url")
    .gt("ends_at", new Date().toISOString())
    .order("starts_at")
    .limit(clampLimit(limit));
  if (error) throw new Error("Falha ao carregar as próximas reuniões");
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    allDay: row.all_day,
    color: row.color,
    location: row.location,
    meetingUrl: row.meeting_url,
    href: `/operacional/agenda?visao=dia&data=${wallParts(row.starts_at).dayKey}`,
  }));
}

/** Cartões atribuídos ao usuário atual, não arquivados e não concluídos; com prazo primeiro. */
export async function getMyOpenCards(limit: number): Promise<MyOpenCard[]> {
  const profile = await getCurrentProfile();
  if (!profile) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cards")
    .select("id, title, due_at, board_id, boards(name), board_lists!cards_list_id_fkey(name), card_assignees!inner(profile_id)")
    .eq("card_assignees.profile_id", profile.id)
    .eq("archived", false)
    .eq("completed", false)
    .order("due_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(clampLimit(limit));
  if (error) throw new Error("Falha ao carregar suas missões");
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    dueAt: row.due_at,
    boardId: row.board_id,
    boardName: row.boards?.name ?? "",
    listName: row.board_lists?.name ?? "",
    href: `/operacional/missoes/${row.board_id}`,
  }));
}
