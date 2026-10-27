"use client";

import { useState } from "react";

/** Linhas dinâmicas com chave estável (para React) e o id do banco quando a linha já existe. */
export function useRows<T extends { id?: string }>(initial: T[], empty: () => T) {
  const [rows, setRows] = useState(() => initial.map((value, i) => ({ key: value.id ?? `initial-${i}`, value })));

  return {
    rows,
    add: () => setRows((current) => [...current, { key: crypto.randomUUID(), value: empty() }]),
    remove: (key: string) => setRows((current) => current.filter((row) => row.key !== key)),
  };
}
