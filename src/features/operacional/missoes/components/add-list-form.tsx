"use client";

import { Plus, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { createList } from "../board-actions";
import { useBoard } from "./board-context";

/** "+ Adicionar outra lista" no fim do quadro. */
export function AddListForm({ empty }: { empty: boolean }) {
  const { meta, actions } = useBoard();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = name.trim();
    if (!value) return;
    setPending(true);
    const result = await createList({ boardId: meta.boardId, name: value });
    setPending(false);
    if (!result.ok) {
      actions.reportError(result.error);
      return;
    }
    setName("");
    actions.setState((state) =>
      state.lists[result.list.id]
        ? state
        : {
            ...state,
            listOrder: [...state.listOrder, result.list.id],
            lists: { ...state.lists, [result.list.id]: result.list },
            columns: { ...state.columns, [result.list.id]: [] },
          },
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-[272px] shrink-0 items-center gap-2 rounded-xl bg-white/10 px-3 text-sm font-medium text-white backdrop-blur hover:bg-white/20"
      >
        <Plus aria-hidden className="size-4" />
        {empty ? "Adicionar uma lista" : "Adicionar outra lista"}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex w-[272px] shrink-0 flex-col gap-2 self-start rounded-xl bg-surface p-2 ring-1 ring-white/5">
      <label htmlFor="new-list-name" className="sr-only">
        Nome da lista
      </label>
      <input
        id="new-list-name"
        autoFocus
        maxLength={120}
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        placeholder="Insira o nome da lista…"
        className="h-9 rounded-lg border border-border bg-surface-2 px-3 text-sm text-fg placeholder:text-muted focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-ring/60"
      />
      <div className="flex items-center gap-1">
        <Button type="submit" size="sm" loading={pending}>
          Adicionar lista
        </Button>
        <Button variant="ghost" size="sm" aria-label="Cancelar" onClick={() => setOpen(false)}>
          <X aria-hidden />
        </Button>
      </div>
    </form>
  );
}
