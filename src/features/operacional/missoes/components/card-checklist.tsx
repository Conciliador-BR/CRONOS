"use client";

import { CheckSquare, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addChecklistItem, deleteChecklistItem, updateChecklistItem } from "../card-actions";
import { patchCard } from "../board-state";
import type { ChecklistItem } from "../types";
import { useBoard } from "./board-context";
import { SectionTitle } from "./section-title";

export function CardChecklist({ cardId }: { cardId: string }) {
  const { state, meta, actions } = useBoard();
  const items = state.cards[cardId]?.checklist ?? [];
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const done = items.filter((item) => item.done).length;
  const percent = items.length ? Math.round((done / items.length) * 100) : 0;

  const setItems = (change: (items: ChecklistItem[]) => ChecklistItem[]) => (s: typeof state) =>
    patchCard(s, cardId, { checklist: change(s.cards[cardId]?.checklist ?? []) });

  function toggle(item: ChecklistItem) {
    void actions.mutate(
      setItems((list) => list.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i))),
      () => updateChecklistItem({ id: item.id, boardId: meta.boardId, done: !item.done }),
    );
  }

  function remove(item: ChecklistItem) {
    void actions.mutate(
      setItems((list) => list.filter((i) => i.id !== item.id)),
      () => deleteChecklistItem({ id: item.id, boardId: meta.boardId }),
    );
  }

  async function add(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setAdding(true);
    const result = await addChecklistItem({ cardId, boardId: meta.boardId, content });
    setAdding(false);
    if (!result.ok) return actions.reportError(result.error);
    setDraft("");
    actions.setState(setItems((list) => (list.some((i) => i.id === result.item.id) ? list : [...list, result.item])));
  }

  return (
    <section aria-labelledby="card-checklist-title">
      <div className="flex items-center gap-2">
        <CheckSquare aria-hidden className="mb-2 size-4 text-muted" />
        <SectionTitle id="card-checklist-title">Checklist</SectionTitle>
      </div>
      {items.length > 0 ? (
        <div className="mb-3 flex items-center gap-2">
          <span className="w-9 text-xs text-muted tabular-nums">{percent}%</span>
          <div
            role="progressbar"
            aria-label="Progresso do checklist"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3"
          >
            <div
              className={percent === 100 ? "h-full bg-success transition-all" : "h-full bg-primary transition-all"}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      ) : null}
      <ul className="mb-3 flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.id} className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-surface-2">
            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => toggle(item)}
                className="size-4 shrink-0 accent-[var(--primary)]"
              />
              <span className={item.done ? "break-words text-muted line-through" : "break-words text-fg"}>{item.content}</span>
            </label>
            <button
              type="button"
              aria-label={`Excluir item ${item.content}`}
              onClick={() => remove(item)}
              className="grid size-7 shrink-0 place-items-center rounded-md text-muted opacity-60 group-hover:opacity-100 hover:bg-surface-3 hover:text-danger focus-visible:opacity-100"
            >
              <Trash2 aria-hidden className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="flex gap-2">
        <Input
          aria-label="Novo item do checklist"
          placeholder="Adicionar um item"
          maxLength={500}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="h-9"
        />
        <Button type="submit" variant="secondary" size="sm" className="h-9" loading={adding}>
          Adicionar
        </Button>
      </form>
    </section>
  );
}
