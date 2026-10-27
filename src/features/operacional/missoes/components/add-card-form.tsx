"use client";

import { Plus, X } from "lucide-react";
import { useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { createCard } from "../card-actions";
import { appendCard, removeCard } from "../board-state";
import { useBoard } from "./board-context";
import { TEMP_PREFIX } from "./sortable-card";

/** "+ Adicionar um cartão" no fim da lista, com criação otimista. */
export function AddCardForm({ listId }: { listId: string }) {
  const { meta, actions } = useBoard();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const inputId = useId();

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const value = title.trim();
    if (!value) return;
    setTitle("");
    const tempId = `${TEMP_PREFIX}${crypto.randomUUID()}`;
    const temp = {
      id: tempId,
      listId,
      title: value,
      description: "",
      dueAt: null,
      completed: false,
      position: Number.MAX_SAFE_INTEGER,
      labelIds: [],
      assigneeIds: [],
      checklist: [],
      coverAttachmentId: null,
      coverUrl: null,
      attachmentCount: 0,
    };
    actions.setState((state) => appendCard(state, temp));
    const result = await createCard({ boardId: meta.boardId, listId, title: value });
    if (!result.ok) {
      actions.reportError(result.error);
      actions.setState((state) => removeCard(state, tempId));
      return;
    }
    // Troca o temporário pelo cartão real (a revalidação pode já tê-lo trazido).
    actions.setState((state) => {
      const next = removeCard(state, tempId);
      return next.cards[result.card.id] ? next : appendCard(next, result.card);
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    } else if (event.key === "Escape") {
      event.stopPropagation();
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted hover:bg-surface-3 hover:text-fg"
      >
        <Plus aria-hidden className="size-4" />
        Adicionar um cartão
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <label htmlFor={inputId} className="sr-only">
        Título do novo cartão
      </label>
      <textarea
        id={inputId}
        autoFocus
        rows={2}
        maxLength={300}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Insira um título para este cartão…"
        className="w-full resize-none rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg placeholder:text-muted focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-ring/60"
      />
      <div className="flex items-center gap-1">
        <Button type="submit" size="sm">
          Adicionar cartão
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)} aria-label="Cancelar">
          <X aria-hidden />
        </Button>
      </div>
    </form>
  );
}
