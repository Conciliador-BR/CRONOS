"use client";

import { use, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { activeReminders, pendingToasts, type Reminder } from "../reminders";
import { ReminderBell } from "./reminder-bell";
import { ReminderToasts } from "./reminder-toasts";
import { useReminders } from "./use-reminders";

/**
 * Sino da barra superior + avisos flutuantes. Recebe a promessa do layout (não bloqueia a página).
 * Os avisos vão para o <body>: o topo tem backdrop-filter, que prenderia o position: fixed.
 */
export function ReminderCenter({ reminders: promise }: { reminders: Promise<Reminder[]> }) {
  const { reminders, now, dismissed, dismiss } = useReminders(use(promise));
  const [portal, setPortal] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setPortal(document.body), 0);
    return () => clearTimeout(timer);
  }, []);

  const active = now === null ? [] : activeReminders(reminders, now);
  const toasts = now === null ? [] : pendingToasts(reminders, now, dismissed);

  return (
    <>
      <ReminderBell items={active} now={now} />
      {portal ? createPortal(<ReminderToasts items={toasts} now={now} onDismiss={dismiss} />, portal) : null}
    </>
  );
}
