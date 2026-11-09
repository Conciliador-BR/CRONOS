"use client";

import { useEffect, useEffectEvent, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

/** Linhas (índices na ordem da tela) que a alça cobriu numa coluna. */
export type FillRange = { propertyId: string; from: number; to: number };

/** Linha cujo índice cai no intervalo e não é a de origem. */
export function inFillRange(range: FillRange | null, propertyId: string, index: number) {
  if (!range || range.propertyId !== propertyId) return false;
  return index >= Math.min(range.from, range.to) && index <= Math.max(range.from, range.to);
}

/**
 * Alça de preencher do Excel: o usuário arrasta o quadradinho do canto da célula para cima
 * ou para baixo e, ao soltar, `onFill` recebe o intervalo. Esc cancela.
 * shortcut: não rola a tabela sozinho perto da borda; use a roda do mouse durante o arrasto se precisar.
 */
export function useFillHandle(onFill: (range: FillRange) => void) {
  const [range, setRange] = useState<FillRange | null>(null);
  const rangeRef = useRef<FillRange | null>(null);
  const finish = useEffectEvent((apply: boolean) => {
    const current = rangeRef.current;
    rangeRef.current = null;
    setRange(null);
    if (apply && current && current.from !== current.to) onFill(current);
  });
  const active = range !== null;

  useEffect(() => {
    if (!active) return;
    function move(event: PointerEvent) {
      const row = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("tr[data-row-index]");
      const current = rangeRef.current;
      if (!row || !current) return;
      const to = Number(row.dataset.rowIndex);
      if (to === current.to) return;
      rangeRef.current = { ...current, to };
      setRange(rangeRef.current);
    }
    const up = () => finish(true);
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish(false);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("keydown", key);
    };
  }, [active]);

  function start(event: ReactPointerEvent, propertyId: string, index: number) {
    if (event.button !== 0) return;
    // Sem seleção de texto nem arrasto de linha/coluna.
    event.preventDefault();
    event.stopPropagation();
    rangeRef.current = { propertyId, from: index, to: index };
    setRange(rangeRef.current);
  }

  return { range, start };
}
