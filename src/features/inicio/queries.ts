import "server-only";
import { requireMember } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { countDistinct, mergeEvents, sortCards, type MyCard, type UpcomingEvent } from "./summary";

export type HomeSummary = {
  /** Momento da leitura (ms), para comparar prazos sem relógio no render. */
  now: number;
  companies: number;
  states: number;
  openLeads: number;
  upcomingEvents: UpcomingEvent[];
  upcomingWeekCount: number;
  myCards: MyCard[];
  myCardsCount: number;
  /** Partes que falharam ao carregar (o card mostra "indisponível" em vez de 0). */
  failed: Partial<Record<"companies" | "leads" | "events" | "cards", true>>;
};

const CLOSED_STAGES = "(cliente_fechado,cliente_perdido)";

/** Contagens só de leitura para a página inicial (consultas próprias, sem depender de outros módulos). */
export async function getHomeSummary(): Promise<HomeSummary> {
  const profile = await requireMember();
  const supabase = await createClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const weekIso = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const [companies, leads, created, attending, cards] = await Promise.all([
    supabase.from("companies").select("uf"),
    supabase.from("leads").select("id", { count: "exact", head: true }).not("stage", "in", CLOSED_STAGES),
    supabase
      .from("events")
      .select("id, title, starts_at, all_day")
      .eq("created_by", profile.id)
      .gte("starts_at", nowIso)
      .order("starts_at")
      .limit(20),
    supabase
      .from("event_attendees")
      .select("event:events!inner(id, title, starts_at, all_day)")
      .eq("profile_id", profile.id)
      .gte("event.starts_at", nowIso)
      .limit(50),
    supabase
      .from("card_assignees")
      .select("card:cards!inner(id, title, due_at)")
      .eq("profile_id", profile.id)
      .eq("card.archived", false)
      .eq("card.completed", false)
      .limit(200),
  ]);

  const failed: HomeSummary["failed"] = {};
  const parts = { companies, leads, events: created.error ? created : attending, cards } as const;
  for (const [name, res] of Object.entries(parts)) {
    if (!res.error) continue;
    logger.warn({ code: res.error.code, part: name }, "inicio: falha numa contagem");
    failed[name as keyof typeof parts] = true;
  }

  const toEvent = (e: { id: string; title: string; starts_at: string; all_day: boolean }): UpcomingEvent => ({
    id: e.id,
    title: e.title,
    startsAt: e.starts_at,
    allDay: e.all_day,
  });
  const events = mergeEvents(
    (created.data ?? []).map(toEvent),
    (attending.data ?? []).flatMap((a) => (a.event ? [toEvent(a.event)] : [])),
  );
  const myCards = sortCards(
    (cards.data ?? []).flatMap((a) => (a.card ? [{ id: a.card.id, title: a.card.title, dueAt: a.card.due_at }] : [])),
  );
  const ufs = (companies.data ?? []).map((c) => c.uf);

  return {
    now: now.getTime(),
    companies: ufs.length,
    states: countDistinct(ufs),
    openLeads: leads.count ?? 0,
    upcomingEvents: events.slice(0, 3),
    upcomingWeekCount: events.filter((e) => e.startsAt <= weekIso).length,
    myCards: myCards.slice(0, 3),
    myCardsCount: myCards.length,
    failed,
  };
}
