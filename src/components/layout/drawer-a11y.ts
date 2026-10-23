"use client";

import { useEffect, useEffectEvent, type KeyboardEvent } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Chama `onEscape` quando Esc é pressionado enquanto `open` for verdadeiro. */
export function useEscapeKey(open: boolean, onEscape: () => void) {
  const handleEscape = useEffectEvent(onEscape);
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") handleEscape();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);
}

/** Mantém o Tab dentro do painel (use no onKeyDown do contêiner do diálogo). */
export function trapTabKey(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== "Tab") return;
  const nodes = event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE);
  if (nodes.length === 0) return;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/** Devolve o foco ao botão que abriu o painel. */
export function focusById(id: string) {
  document.getElementById(id)?.focus();
}

/** Ref estável que foca o elemento ao montar (função fixa: o React não a chama de novo a cada render). */
export function focusOnMount(el: HTMLElement | null) {
  el?.focus();
}
