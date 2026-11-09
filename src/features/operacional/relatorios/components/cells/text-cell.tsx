"use client";

import { ExternalLink } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import type { CellValue, PropertyType } from "../../types";
import { cellInputClass } from "./cell-styles";
import { formatPtBrNumber, parsePtBrNumber } from "./number";

const INPUT_TYPES: Partial<Record<PropertyType, string>> = { url: "url", phone: "tel", email: "email", number: "text" };
const SAFE_URL = /^https?:\/\//i;

function toText(value: CellValue | null) {
  if (typeof value === "number") return formatPtBrNumber(value);
  return value === null || Array.isArray(value) ? "" : String(value);
}

/**
 * Texto, número, URL, telefone e e-mail: campo sempre editável no lugar.
 * Salva ao sair do campo ou com Enter; Esc desfaz a edição.
 */
export function TextCell({
  type,
  value,
  label,
  onCommit,
}: {
  type: PropertyType;
  value: CellValue | null;
  label: string;
  onCommit: (value: CellValue | null) => void;
}) {
  const saved = toText(value);
  const [draft, setDraft] = useState(saved);
  const [prevSaved, setPrevSaved] = useState(saved);
  if (saved !== prevSaved) {
    setPrevSaved(saved);
    setDraft(saved);
  }
  const [invalid, setInvalid] = useState(false);
  const cancelled = useRef(false);
  const errorId = useId();

  function commit() {
    if (cancelled.current) {
      cancelled.current = false;
      return;
    }
    const text = draft.trim();
    if (text === saved) return setInvalid(false);
    if (!text) return onCommit(null);
    if (type === "number") {
      const number = parsePtBrNumber(text);
      if (number === null) return setInvalid(true);
      setInvalid(false);
      if (number === value) return setDraft(saved);
      return onCommit(number);
    }
    onCommit(text);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") event.currentTarget.blur();
    if (event.key === "Escape") {
      cancelled.current = true;
      setDraft(saved);
      setInvalid(false);
      event.currentTarget.blur();
    }
  }

  const link = type === "url" && SAFE_URL.test(saved) ? saved : null;

  return (
    <div className="flex items-center">
      <input
        type={INPUT_TYPES[type] ?? "text"}
        inputMode={type === "number" ? "decimal" : undefined}
        aria-label={label}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
        value={draft}
        maxLength={type === "text" ? 2000 : 500}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        className={`${cellInputClass} ${type === "number" ? "text-right tabular-nums" : ""} aria-[invalid=true]:outline-danger`}
      />
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir link em nova aba: ${link}`}
          className="mr-1 grid size-7 shrink-0 place-items-center rounded text-ring hover:bg-surface-2"
        >
          <ExternalLink aria-hidden className="size-3.5" />
        </a>
      ) : null}
      {invalid ? (
        <span id={errorId} role="alert" className="mr-1 shrink-0 text-xs text-danger">
          Número inválido
        </span>
      ) : null}
    </div>
  );
}
