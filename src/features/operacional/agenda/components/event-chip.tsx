"use client";

import { cn } from "@/lib/utils";
import { formatTime } from "../../shared/tz";
import type { CalendarEvent } from "../types";
import { useAgenda } from "./agenda-context";

/** Evento compacto (visão mês e linha de dia inteiro). */
export function EventChip({ event, className }: { event: CalendarEvent; className?: string }) {
  const { actions } = useAgenda();
  const label = event.allDay ? `${event.title}, dia inteiro` : `${formatTime(event.startsAt)} ${event.title}`;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        actions.select(event);
      }}
      aria-label={label}
      className={cn(
        "flex w-full min-w-0 items-center gap-1.5 truncate rounded px-1.5 py-0.5 text-left text-xs",
        event.allDay ? "font-medium text-white hover:brightness-110" : "text-fg hover:bg-surface-3",
        className,
      )}
      style={event.allDay ? { backgroundColor: event.color } : undefined}
    >
      {event.allDay ? null : (
        <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: event.color }} />
      )}
      {event.allDay ? null : <span className="shrink-0 text-muted tabular-nums">{formatTime(event.startsAt)}</span>}
      <span className="truncate">{event.title}</span>
    </button>
  );
}
