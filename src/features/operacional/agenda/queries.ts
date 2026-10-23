import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { CalendarEvent } from "./types";

const EVENT_COLUMNS =
  "id, title, description, location, meeting_url, color, starts_at, ends_at, all_day, created_by, creator:profiles!events_created_by_fkey(full_name), event_attendees(profile_id)";

/** Eventos que tocam o intervalo [from, to). */
export async function getEventsInRange(from: string, to: string): Promise<CalendarEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .lt("starts_at", to)
    .gte("ends_at", from)
    .order("starts_at")
    .limit(1000);
  if (error) throw new Error("Falha ao carregar a agenda");
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    location: row.location ?? "",
    meetingUrl: row.meeting_url ?? "",
    color: row.color,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    allDay: row.all_day,
    createdBy: row.created_by,
    creatorName: row.creator?.full_name || "Ex-funcionário",
    attendeeIds: row.event_attendees.map((item) => item.profile_id),
  }));
}
