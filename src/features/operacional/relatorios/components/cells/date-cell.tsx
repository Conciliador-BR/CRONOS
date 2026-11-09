"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { cellInputClass } from "./cell-styles";

/** Data (aaaa-mm-dd): salva ao sair do campo ou com Enter, não a cada tecla; Esc desfaz. */
export function DateCell({
  value,
  label,
  onCommit,
}: {
  value: string | null;
  label: string;
  onCommit: (value: string | null) => void;
}) {
  const saved = value ?? "";
  const [draft, setDraft] = useState(saved);
  const [prevSaved, setPrevSaved] = useState(saved);
  if (saved !== prevSaved) {
    setPrevSaved(saved);
    setDraft(saved);
  }
  const cancelled = useRef(false);

  function commit() {
    if (cancelled.current) {
      cancelled.current = false;
      return;
    }
    if (draft !== saved) onCommit(draft || null);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") event.currentTarget.blur();
    if (event.key === "Escape") {
      cancelled.current = true;
      setDraft(saved);
      event.currentTarget.blur();
    }
  }

  return (
    <input
      type="date"
      aria-label={label}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={onKeyDown}
      className={`${cellInputClass} [color-scheme:dark]`}
    />
  );
}
