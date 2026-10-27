"use client";

import { BellRing, X } from "lucide-react";
import Link from "next/link";
import type { KeyboardEvent } from "react";
import { describeReminder, THRESHOLD_LABEL, type ActiveReminder } from "../reminders";

const MAX_VISIBLE = 3;

/**
 * Avisos no canto da tela ("Falta 1 dia" / "Falta 1 hora"). A região aria-live existe desde a
 * montagem, então cada aviso novo é anunciado. Esc (com foco no aviso) ou o X dispensam.
 */
export function ReminderToasts({
  items,
  now,
  onDismiss,
}: {
  items: ActiveReminder[];
  now: number | null;
  onDismiss: (item: ActiveReminder) => void;
}) {
  const visible = items.slice(0, MAX_VISIBLE);
  const hidden = items.length - visible.length;

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>, item: ActiveReminder) {
    if (event.key !== "Escape") return;
    event.stopPropagation();
    onDismiss(item);
  }

  return (
    <section
      aria-label="Avisos de lembrete"
      className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
    >
      <div aria-live="polite" aria-relevant="additions" className="flex flex-col gap-2">
        {now === null
          ? null
          : visible.map((item) => {
              const { text, relative } = describeReminder(item.reminder, item.threshold, now);
              const titleId = `lembrete-${item.key.replace(/[^a-zA-Z0-9-]/g, "")}`;
              return (
                <div
                  key={item.key}
                  role="group"
                  aria-labelledby={titleId}
                  onKeyDown={(event) => onKeyDown(event, item)}
                  className="pointer-events-auto flex gap-3 rounded-xl border border-primary/40 bg-surface p-3 text-fg shadow-2xl shadow-black/60 motion-safe:animate-pop-in"
                >
                  <BellRing aria-hidden className={item.threshold === "hour" ? "mt-0.5 size-5 shrink-0 text-warning" : "mt-0.5 size-5 shrink-0 text-accent"} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold tracking-wide text-accent uppercase">{THRESHOLD_LABEL[item.threshold]}</p>
                    <p id={titleId} className="truncate text-sm font-semibold">
                      {item.reminder.title}
                    </p>
                    <p className="text-sm text-muted">
                      {text}
                      {item.threshold === "day" ? ` (${relative})` : ""}
                    </p>
                    <Link
                      href={item.reminder.href}
                      onClick={() => onDismiss(item)}
                      className="mt-1 inline-block text-sm font-medium text-accent underline-offset-2 hover:underline"
                    >
                      {item.reminder.kind === "reuniao" ? "Ver na agenda" : "Abrir quadro"}
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDismiss(item)}
                    aria-label={`Dispensar lembrete: ${item.reminder.title}`}
                    className="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
                  >
                    <X aria-hidden className="size-4" />
                  </button>
                </div>
              );
            })}
      </div>
      {now !== null && hidden > 0 ? (
        <p className="pointer-events-auto self-end rounded-md bg-surface px-2 py-1 text-xs text-muted ring-1 ring-border">
          +{hidden} no sino de lembretes
        </p>
      ) : null}
    </section>
  );
}
