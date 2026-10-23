"use client";

import { formatTime } from "../../shared/tz";
import type { PositionedEvent } from "../calendar";
import type { CalendarEvent } from "../types";
import { useAgenda } from "./agenda-context";

/** Bloco do evento posicionado na grade de horas, com a cor do evento. */
export function TimedEvent({ item, pxPerMinute }: { item: PositionedEvent<CalendarEvent>; pxPerMinute: number }) {
  const { actions } = useAgenda();
  const { event, top, height, column, columns } = item;
  const short = height * pxPerMinute < 36;
  const range = `${formatTime(event.startsAt)} – ${formatTime(event.endsAt)}`;
  return (
    <button
      type="button"
      onClick={() => actions.select(event)}
      aria-label={`${event.title}, ${range}`}
      className="pointer-events-auto absolute z-10 overflow-hidden rounded-md border-l-4 px-1.5 py-0.5 text-left text-xs leading-tight text-white shadow-sm shadow-black/40 hover:z-30 hover:brightness-110 focus-visible:z-30"
      style={{
        top: top * pxPerMinute + 1,
        height: Math.max(height * pxPerMinute - 2, 16),
        left: `calc(${(column / columns) * 100}% + 1px)`,
        width: `calc(${100 / columns}% - 2px)`,
        backgroundColor: `color-mix(in srgb, ${event.color} 70%, #0b1020)`,
        borderLeftColor: event.color,
      }}
    >
      <span className="block truncate font-semibold">{event.title}</span>
      {short ? null : <span className="block truncate opacity-90 tabular-nums">{range}</span>}
    </button>
  );
}
