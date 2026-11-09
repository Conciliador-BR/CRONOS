"use client";

import { useEffect } from "react";

/** Enquanto `active`, Esc não fecha o <dialog> aberto (ex.: ação em andamento no modal). */
export function useBlockEscape(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const block = (event: KeyboardEvent) => {
      if (event.key === "Escape") event.preventDefault();
    };
    window.addEventListener("keydown", block, { capture: true });
    return () => window.removeEventListener("keydown", block, { capture: true });
  }, [active]);
}
