import "server-only";
import { getCurrentProfile } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { wallParts } from "@/features/operacional/shared/tz";
import { LOOKAHEAD_MS, type Reminder } from "./reminders";

const EVENT_COLUMNS = "id, title, starts_at, all_day";

/**
 * Reuniões do usuário (criou ou é convidado) e tarefas atribuídas a ele que começam/vencem
 * nas próximas 25 h. Nunca lança: falha vira lista vazia (o sino não pode derrubar o app).
 */
export async function getMyReminders(): Promise<Reminder[]> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) return [];
    const supabase = await createClient();
    const from = new Date().toISOString();
    const until = new Date(Date.now() + LOOKAHEAD_MS).toISOString();

    const [created, attending, cards] = await Promise.all([
      supabase
        .from("events")
        .select(EVENT_COLUMNS)
        .eq("created_by", profile.id)
        .gt("starts_at", from)
        .lte("starts_at", until)
        .order("starts_at")
        .limit(50),
      supabase
        .from("events")
        .select(`${EVENT_COLUMNS}, event_attendees!inner(profile_id)`)
        .eq("event_attendees.profile_id", profile.id)
        .gt("starts_at", from)
        .lte("starts_at", until)
        .order("starts_at")
        .limit(50),
      supabase
        .from("cards")
        .select("id, title, due_at, board_id, card_assignees!inner(profile_id)")
        .eq("card_assignees.profile_id", profile.id)
        .eq("archived", false)
        .eq("completed", false)
        .gt("due_at", from)
        .lte("due_at", until)
        .order("due_at")
        .limit(20),
    ]);
    for (const [scope, result] of [["events.created", created], ["events.attending", attending], ["cards", cards]] as const) {
      if (result.error) logger.warn({ scope: `lembretes.${scope}`, code: result.error.code }, "reminder query failed");
    }

    const events = new Map<string, Reminder>();
    for (const row of [...(created.data ?? []), ...(attending.data ?? [])]) {
      events.set(row.id, {
        id: row.id,
        kind: "reuniao",
        title: row.title,
        startsAt: row.starts_at,
        allDay: row.all_day,
        href: `/operacional/agenda?visao=dia&data=${wallParts(row.starts_at).dayKey}`,
      });
    }
    const tasks: Reminder[] = (cards.data ?? []).flatMap((row) =>
      row.due_at
        ? [{ id: row.id, kind: "tarefa", title: row.title, startsAt: row.due_at, allDay: false, href: `/operacional/missoes/${row.board_id}` }]
        : [],
    );
    return [...events.values(), ...tasks];
  } catch (error) {
    logger.warn({ scope: "lembretes", name: error instanceof Error ? error.name : typeof error }, "reminders failed");
    return [];
  }
}
