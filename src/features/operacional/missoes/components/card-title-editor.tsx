"use client";

import { useState, type KeyboardEvent } from "react";
import { updateCard } from "../card-actions";
import { patchCard } from "../board-state";
import { useBoard } from "./board-context";

/** Título do cartão: clique para editar; Enter salva, Esc cancela. */
export function CardTitleEditor({ cardId }: { cardId: string }) {
  const { state, meta, actions } = useBoard();
  const title = state.cards[cardId]?.title ?? "";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  function commit() {
    setEditing(false);
    const value = draft.trim();
    if (!value || value === title) return setDraft(title);
    void actions.mutate(
      (s) => patchCard(s, cardId, { title: value }),
      () => updateCard({ id: cardId, boardId: meta.boardId, title: value }),
    );
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setDraft(title);
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <textarea
        autoFocus
        aria-label="Título do cartão"
        rows={2}
        maxLength={300}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        className="w-full resize-none rounded-md border border-ring bg-surface-2 px-2 py-1 text-lg font-semibold text-fg outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(title);
        setEditing(true);
      }}
      title="Editar título"
      className="-mx-2 w-full rounded-md px-2 py-1 text-left break-words hover:bg-surface-2"
    >
      {title}
    </button>
  );
}
