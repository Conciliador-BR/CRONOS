import { ACCENT_COLORS } from "../../shared/colors";
import { wallParts } from "../../shared/tz";
import { addDaysToKey } from "../calendar";
import type { CalendarEvent } from "../types";
import type { EventDraft } from "./agenda-context";

const pad = (n: number) => String(n).padStart(2, "0");

/** Nova reunião de 1 h começando em `minutes` do dia. */
export function newDraft(dayKey: string, minutes = 9 * 60): EventDraft {
  const startMinutes = Math.min(minutes, 23 * 60);
  const endMinutes = Math.min(startMinutes + 60, 23 * 60 + 59);
  return {
    title: "",
    description: "",
    location: "",
    meetingUrl: "",
    color: ACCENT_COLORS[0].value,
    allDay: false,
    startDay: dayKey,
    startTime: `${pad(Math.floor(startMinutes / 60))}:${pad(startMinutes % 60)}`,
    endDay: dayKey,
    endTime: `${pad(Math.floor(endMinutes / 60))}:${pad(endMinutes % 60)}`,
    attendeeIds: [],
  };
}

export function draftFromEvent(event: CalendarEvent): EventDraft {
  const start = wallParts(event.startsAt);
  const end = wallParts(event.endsAt);
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    meetingUrl: event.meetingUrl,
    color: event.color,
    allDay: event.allDay,
    startDay: start.dayKey,
    startTime: start.time,
    // Dia inteiro guarda fim exclusivo (meia-noite do dia seguinte).
    endDay: event.allDay ? addDaysToKey(end.dayKey, -1) : end.dayKey,
    endTime: event.allDay ? "23:59" : end.time,
    attendeeIds: event.attendeeIds,
  };
}
