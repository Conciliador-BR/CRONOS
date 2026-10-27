"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { failure, forbidden, invalid, requireMember } from "../shared/action-utils";
import type { ActionResult } from "../shared/result";
import { wallToIso } from "../shared/tz";
import { addDaysToKey } from "./calendar";
import { eventInputSchema, type EventInput } from "./schemas";

const AGENDA_PATH = "/operacional/agenda";
type Supabase = Awaited<ReturnType<typeof createClient>>;

function toRow(values: EventInput) {
  return {
    title: values.title,
    description: values.description || null,
    location: values.location || null,
    meeting_url: values.meetingUrl || null,
    color: values.color,
    all_day: values.allDay,
    starts_at: wallToIso(values.startDay, values.allDay ? "00:00" : values.startTime),
    ends_at: values.allDay ? wallToIso(addDaysToKey(values.endDay, 1)) : wallToIso(values.endDay, values.endTime),
  };
}

/** Só funcionários ativos podem ser convidados. */
async function activeIds(supabase: Supabase, ids: string[]) {
  if (ids.length === 0) return [];
  const { data } = await supabase.from("profiles").select("id").eq("active", true).in("id", ids);
  return (data ?? []).map((row) => row.id);
}

async function syncAttendees(supabase: Supabase, eventId: string, ids: string[]) {
  const wanted = await activeIds(supabase, [...new Set(ids)]);
  const remove = supabase.from("event_attendees").delete().eq("event_id", eventId);
  const { error: deleteError } = wanted.length
    ? await remove.not("profile_id", "in", `(${wanted.join(",")})`)
    : await remove;
  if (deleteError) return deleteError;
  if (wanted.length === 0) return null;
  const { error } = await supabase
    .from("event_attendees")
    .upsert(wanted.map((profile_id) => ({ event_id: eventId, profile_id })), { ignoreDuplicates: true });
  return error;
}

export async function createEvent(input: unknown): Promise<ActionResult<{ id: string }>> {
  const profile = await requireMember();
  const parsed = eventInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .insert({ ...toRow(parsed.data), created_by: profile.id })
    .select("id")
    .single();
  if (error) return failure("agenda.createEvent", error);
  const attendeesError = await syncAttendees(supabase, data.id, parsed.data.attendeeIds);
  if (attendeesError) return failure("agenda.createEvent.attendees", attendeesError);
  revalidatePath(AGENDA_PATH);
  revalidatePath("/inicio");
  return { ok: true, id: data.id };
}

async function canEdit(supabase: Supabase, eventId: string, profile: Awaited<ReturnType<typeof requireMember>>) {
  const { data } = await supabase.from("events").select("created_by").eq("id", eventId).maybeSingle();
  if (!data) return false;
  return data.created_by === profile.id || isManager(profile);
}

export async function updateEvent(eventId: unknown, input: unknown): Promise<ActionResult> {
  const profile = await requireMember();
  const parsedId = z.uuid().safeParse(eventId);
  if (!parsedId.success) return invalid(parsedId.error);
  const parsed = eventInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const id = parsedId.data;
  const values = parsed.data;
  const supabase = await createClient();
  if (!(await canEdit(supabase, id, profile))) return forbidden;
  const { data, error } = await supabase.from("events").update(toRow(values)).eq("id", id).select("id");
  if (error) return failure("agenda.updateEvent", error);
  if (!data?.length) return forbidden;
  const attendeesError = await syncAttendees(supabase, id, values.attendeeIds);
  if (attendeesError) return failure("agenda.updateEvent.attendees", attendeesError);
  revalidatePath(AGENDA_PATH);
  revalidatePath("/inicio");
  return { ok: true };
}

export async function deleteEvent(id: unknown): Promise<ActionResult> {
  const profile = await requireMember();
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  if (!(await canEdit(supabase, parsed.data, profile))) return forbidden;
  const { data, error } = await supabase.from("events").delete().eq("id", parsed.data).select("id");
  if (error) return failure("agenda.deleteEvent", error);
  if (!data?.length) return forbidden;
  revalidatePath(AGENDA_PATH);
  revalidatePath("/inicio");
  return { ok: true };
}
