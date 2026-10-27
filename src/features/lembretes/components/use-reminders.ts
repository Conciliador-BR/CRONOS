"use client";

import { useEffect, useRef, useState } from "react";
import { refreshReminders } from "../actions";
import {
  DISMISSED_STORAGE_KEY,
  dismissalExpiry,
  MINUTE_MS,
  nextChangeIn,
  parseDismissed,
  pruneDismissed,
  type ActiveReminder,
  type Reminder,
} from "../reminders";

const REFRESH_MS = 5 * MINUTE_MS;
/** Relógio mínimo: atualiza os textos relativos ("em 45 minutos"). */
const TICK_MS = 30 * 1000;

function readDismissed(now: number): Record<string, number> {
  try {
    return parseDismissed(window.localStorage.getItem(DISMISSED_STORAGE_KEY), now);
  } catch {
    return {};
  }
}

function writeDismissed(value: Record<string, number>) {
  try {
    window.localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Sem armazenamento (aba anônima, bloqueado): a dispensa vale só nesta sessão.
  }
}

/**
 * Estado dos lembretes no cliente: lista (do servidor, atualizada a cada 5 min e ao voltar à aba),
 * relógio (dispara os limiares com a página aberta) e dispensas (localStorage).
 * `now` fica null até montar, para o HTML do servidor bater com o do navegador.
 */
export function useReminders(initial: Reminder[]) {
  const [source, setSource] = useState(initial);
  const [reminders, setReminders] = useState(initial);
  const [now, setNow] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState<Record<string, number>>({});
  const lastRefresh = useRef(0);

  if (initial !== source) {
    setSource(initial);
    setReminders(initial);
  }

  // Monta: lê as dispensas e liga o relógio um instante depois, para a região aria-live
  // já existir quando os avisos entrarem (assim o leitor de tela anuncia).
  useEffect(() => {
    lastRefresh.current = Date.now();
    const timer = setTimeout(() => {
      const current = Date.now();
      setDismissed(readDismissed(current));
      setNow(current);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Relógio: acorda no próximo limiar (ou a cada 30 s, o que vier antes).
  useEffect(() => {
    if (now === null) return;
    const next = nextChangeIn(reminders, now);
    const delay = Math.max(1000, Math.min(next === null ? TICK_MS : next + 50, TICK_MS));
    const timer = setTimeout(() => setNow(Date.now()), delay);
    return () => clearTimeout(timer);
  }, [now, reminders]);

  // Busca no servidor a cada 5 min e quando a aba volta a ficar visível (no máximo 1x por minuto).
  useEffect(() => {
    let alive = true;
    const refresh = () => {
      lastRefresh.current = Date.now();
      refreshReminders().then(
        (list) => {
          if (alive) setReminders(list);
        },
        () => {},
      );
    };
    const interval = setInterval(refresh, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      setNow(Date.now());
      if (Date.now() - lastRefresh.current > MINUTE_MS) refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  function dismiss(item: ActiveReminder) {
    setDismissed((current) => {
      const next = { ...pruneDismissed(current, Date.now()), [item.key]: dismissalExpiry(item.reminder) };
      writeDismissed(next);
      return next;
    });
  }

  return { reminders, now, dismissed: new Set(Object.keys(dismissed)), dismiss };
}
