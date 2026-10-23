"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { agendaHref, dayNumber, eventsOnDay, weekdayLabel } from "../calendar";
import type { CalendarEvent } from "../types";
import { useAgenda } from "./agenda-context";
import { newDraft } from "./drafts";
import { EventChip } from "./event-chip";
import { formatLongDate, wallToIso } from "../../shared/tz";

const MAX_VISIBLE = 3;

/** Visão mês: semanas completas; clique no dia cria reunião às 9h. */
export function MonthGrid({ days, month, today, events }: { days: string[]; month: string; today: string; events: CalendarEvent[] }) {
  const { actions } = useAgenda();
  const weeks: string[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="grid grid-cols-7 border-b border-border">
        {days.slice(0, 7).map((day) => (
          <div key={day} className="py-2 text-center text-xs font-medium text-muted uppercase">
            {weekdayLabel(day)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7" style={{ gridTemplateRows: `repeat(${weeks.length}, minmax(6.5rem, 1fr))` }}>
        {days.map((day) => {
          const dayEvents = eventsOnDay(events, day);
          const outside = day.slice(0, 7) !== month;
          const isToday = day === today;
          const longLabel = formatLongDate(wallToIso(day, "12:00"));
          return (
            <div
              key={day}
              className={cn("relative flex min-w-0 flex-col gap-0.5 border-r border-b border-border p-1 [&:nth-child(7n)]:border-r-0", outside && "bg-bg/40")}
            >
              <button
                type="button"
                onClick={() => actions.openNew(newDraft(day))}
                className="absolute inset-0 hover:bg-surface-2/60 focus-visible:outline-offset-[-2px]"
              >
                <span className="sr-only">Nova reunião em {longLabel}</span>
              </button>
              <Link
                href={agendaHref("day", day)}
                aria-label={`Ver ${longLabel}`}
                aria-current={isToday ? "date" : undefined}
                className={cn(
                  "relative mx-auto grid size-7 place-items-center rounded-full text-xs font-medium tabular-nums",
                  isToday ? "bg-primary text-primary-fg" : outside ? "text-muted" : "text-fg hover:bg-surface-3",
                )}
              >
                {dayNumber(day)}
              </Link>
              <ul className="relative flex min-w-0 flex-col gap-0.5">
                {dayEvents.slice(0, MAX_VISIBLE).map((event) => (
                  <li key={event.id} className="min-w-0">
                    <EventChip event={event} />
                  </li>
                ))}
              </ul>
              {dayEvents.length > MAX_VISIBLE ? (
                <Link
                  href={agendaHref("day", day)}
                  className="relative rounded px-1.5 text-xs font-medium text-muted hover:bg-surface-3 hover:text-fg"
                >
                  Mais {dayEvents.length - MAX_VISIBLE}
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
