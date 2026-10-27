"use client";

import { Bell, CalendarClock, ListTodo } from "lucide-react";
import Link from "next/link";
import { useId, useRef, useState, type ToggleEvent } from "react";
import { cn } from "@/lib/utils";
import { describeReminder, THRESHOLD_LABEL, type ActiveReminder } from "../reminders";

const PANEL_WIDTH = 320;

/** Sino com contador e painel (Popover API: Esc e clique fora fecham) com os lembretes ativos. */
export function ReminderBell({ items, now }: { items: ActiveReminder[]; now: number | null }) {
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const count = items.length;

  function onBeforeToggle(event: ToggleEvent<HTMLDivElement>) {
    const button = buttonRef.current;
    if (event.newState !== "open" || !button) return;
    const rect = button.getBoundingClientRect();
    const width = Math.min(PANEL_WIDTH, window.innerWidth - 16);
    event.currentTarget.style.width = `${width}px`;
    event.currentTarget.style.top = `${rect.bottom + 8}px`;
    event.currentTarget.style.left = `${Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8))}px`;
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        popoverTarget={panelId}
        aria-expanded={open}
        aria-label={count > 0 ? `Lembretes: ${count} ${count === 1 ? "ativo" : "ativos"}` : "Lembretes"}
        className="relative grid size-9 shrink-0 place-items-center rounded-md border border-border text-muted hover:border-primary/50 hover:text-fg"
      >
        <Bell aria-hidden className="size-4" />
        {count > 0 ? (
          <span
            aria-hidden
            className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-fg tabular-nums"
          >
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>
      <div
        ref={panelRef}
        id={panelId}
        popover="auto"
        role="dialog"
        aria-labelledby={`${panelId}-title`}
        onBeforeToggle={onBeforeToggle}
        onToggle={(event) => setOpen(event.newState === "open")}
        className="fixed inset-auto m-0 max-h-[70dvh] overflow-y-auto rounded-xl border border-border bg-surface p-3 text-fg shadow-2xl shadow-black/60"
      >
        <h2 id={`${panelId}-title`} className="mb-1 text-sm font-semibold">
          Lembretes
        </h2>
        <p className="mb-2 text-xs text-muted">Reuniões e tarefas suas nas próximas 24 horas.</p>
        {count === 0 || now === null ? (
          <p className="rounded-lg bg-surface-2 px-3 py-4 text-center text-sm text-muted">Nenhum lembrete agora.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const { text, relative } = describeReminder(item.reminder, item.threshold, now);
              const Icon = item.reminder.kind === "reuniao" ? CalendarClock : ListTodo;
              return (
                <li key={item.key}>
                  <Link
                    href={item.reminder.href}
                    onClick={() => panelRef.current?.hidePopover()}
                    className="flex gap-3 rounded-lg px-2 py-2 hover:bg-surface-2"
                  >
                    <Icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", item.threshold === "hour" ? "text-warning" : "text-accent")} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{item.reminder.title}</span>
                      <span className="block text-xs text-muted">{text}</span>
                      <span className="block text-xs text-muted">
                        {THRESHOLD_LABEL[item.threshold]} · começa {relative}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
