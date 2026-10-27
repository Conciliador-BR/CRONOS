"use client";

import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { toggleCardLabel } from "../card-actions";
import { patchCard } from "../board-state";
import { useBoard } from "./board-context";
import { LabelCreator } from "./label-creator";
import { SectionTitle } from "./section-title";

/** Etiquetas do cartão + seletor com as etiquetas do quadro. */
export function CardLabels({ cardId }: { cardId: string }) {
  const { state, meta, actions } = useBoard();
  const card = state.cards[cardId];
  const [open, setOpen] = useState(false);
  if (!card) return null;
  const selected = new Set(card.labelIds);

  function toggle(labelId: string) {
    const on = !selected.has(labelId);
    const labelIds = on ? [...card.labelIds, labelId] : card.labelIds.filter((id) => id !== labelId);
    void actions.mutate(
      (s) => patchCard(s, cardId, { labelIds }),
      () => toggleCardLabel({ cardId, boardId: meta.boardId, targetId: labelId, on }),
    );
  }

  return (
    <section aria-labelledby="card-labels-title" className="min-w-0">
      <SectionTitle id="card-labels-title">Etiquetas</SectionTitle>
      <div className="flex flex-wrap items-center gap-1.5">
        {card.labelIds.map((labelId) => {
          const label = meta.labelsById.get(labelId);
          return label ? (
            <Badge key={label.id} color={label.color} dot className="h-7 rounded-md">
              {label.name || "Sem nome"}
            </Badge>
          ) : null;
        })}
        <button
          type="button"
          aria-expanded={open}
          aria-controls="card-labels-picker"
          aria-label="Escolher etiquetas"
          onClick={() => setOpen((value) => !value)}
          className="grid size-7 place-items-center rounded-md bg-surface-2 text-muted hover:bg-surface-3 hover:text-fg"
        >
          <Plus aria-hidden className="size-4" />
        </button>
      </div>
      {open ? (
        <div id="card-labels-picker" className="mt-2 w-72 max-w-full rounded-lg border border-border bg-surface-2 p-3">
          {state.labels.length > 0 ? (
            <ul className="mb-3 flex flex-col gap-1">
              {state.labels.map((label) => (
                <li key={label.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={selected.has(label.id)}
                    onClick={() => toggle(label.id)}
                    className="flex w-full items-center gap-2 rounded-md p-1 hover:bg-surface-3"
                  >
                    <span className="grid size-4 place-items-center rounded border border-border bg-surface">
                      {selected.has(label.id) ? <Check aria-hidden className="size-3 text-ring" /> : null}
                    </span>
                    <span
                      className="h-7 flex-1 truncate rounded px-2 text-left text-sm leading-7 font-medium text-white"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-3 text-sm text-muted">Este quadro ainda não tem etiquetas.</p>
          )}
          <LabelCreator onCreated={(labelId) => toggle(labelId)} />
        </div>
      ) : null}
    </section>
  );
}
