"use client";

import Link from "next/link";
import { useEffect, useRef, type MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { formatLongDate, wallToIso } from "../../shared/tz";
import { agendaHref, dayNumber, eventsOnDay, layoutDay, weekdayLabel } from "../calendar";
import type { CalendarEvent } from "../types";
import { useAgenda } from "./agenda-context";
import { newDraft } from "./drafts";
import { EventChip } from "./event-chip";
import { NowLine } from "./now-line";
import { TimedEvent } from "./timed-event";

export const HOUR_HEIGHT = 48;
const PX_PER_MINUTE = HOUR_HEIGHT / 60;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

/** Grade de horas (semana ou dia). Clique num horário abre "Nova reunião" já preenchida. */
export function TimeGrid({ days, today, events }: { days: string[]; today: string; events: CalendarEvent[] }) {
  const { actions } = useAgenda();
  const scrollRef = useRef<HTMLDivElement>(null);
  const allDay = events.filter((event) => event.allDay);
  const cols = { gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 7 * HOUR_HEIGHT;
  }, []);

  function onSlotClick(day: string, hour: number, event: MouseEvent<HTMLButtonElement>) {
    const half = event.nativeEvent.offsetY > HOUR_HEIGHT / 2 ? 30 : 0;
    actions.openNew(newDraft(day, hour * 60 + half));
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className={cn("overflow-x-auto", days.length > 1 && "min-w-0")}>
        <div className={days.length > 1 ? "min-w-[720px]" : undefined}>
          <div className="grid border-b border-border" style={cols}>
            <div aria-hidden />
            {days.map((day) => (
              <Link
                key={day}
                href={agendaHref("day", day)}
                aria-current={day === today ? "date" : undefined}
                className="flex flex-col items-center gap-0.5 py-2 hover:bg-surface-2"
              >
                <span className={cn("text-xs font-medium uppercase", day === today ? "text-ring" : "text-muted")}>
                  {weekdayLabel(day)}
                </span>
                <span
                  className={cn(
                    "grid size-9 place-items-center rounded-full text-lg tabular-nums",
                    day === today ? "bg-primary text-primary-fg" : "text-fg",
                  )}
                >
                  {dayNumber(day)}
                </span>
              </Link>
            ))}
          </div>
          {allDay.length > 0 ? (
            <div className="grid border-b border-border" style={cols}>
              <div className="self-center pr-2 text-right text-[10px] text-muted">dia todo</div>
              {days.map((day) => (
                <ul key={day} className="flex min-w-0 flex-col gap-0.5 border-l border-border p-0.5">
                  {eventsOnDay(allDay, day).map((event) => (
                    <li key={event.id}>
                      <EventChip event={event} />
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          ) : null}
          <div ref={scrollRef} className="max-h-[calc(100dvh-20rem)] min-h-[360px] overflow-y-auto overscroll-contain">
            <div className="relative grid" style={cols}>
              <div aria-hidden>
                {HOURS.map((hour) => (
                  <div key={hour} className="relative text-right" style={{ height: HOUR_HEIGHT }}>
                    {hour > 0 ? (
                      <span className="absolute -top-2 right-2 text-[10px] text-muted tabular-nums">{hourLabel(hour)}</span>
                    ) : null}
                  </div>
                ))}
              </div>
              {days.map((day) => {
                const label = formatLongDate(wallToIso(day, "12:00"));
                return (
                  <div key={day} className="relative border-l border-border">
                    {HOURS.map((hour) => (
                      <button
                        key={hour}
                        type="button"
                        onClick={(event) => onSlotClick(day, hour, event)}
                        className="block w-full border-t border-border/70 first:border-t-0 hover:bg-surface-2/70 focus-visible:outline-offset-[-2px]"
                        style={{ height: HOUR_HEIGHT }}
                      >
                        <span className="sr-only">
                          Nova reunião em {label} às {hourLabel(hour)}
                        </span>
                      </button>
                    ))}
                    <div className="pointer-events-none absolute inset-0 mr-2">
                      {layoutDay(events, day).map((item) => (
                        <TimedEvent key={item.event.id} item={item} pxPerMinute={PX_PER_MINUTE} />
                      ))}
                    </div>
                    <NowLine day={day} pxPerMinute={PX_PER_MINUTE} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
