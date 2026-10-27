"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { wallParts, wallToIso } from "../../shared/tz";
import { updateCard } from "../card-actions";
import { patchCard } from "../board-state";
import { DUE_STATUS_LABEL, formatDue, getDueStatus } from "../due";
import { useBoard } from "./board-context";
import { SectionTitle } from "./section-title";

const statusVariant = { completed: "success", overdue: "danger", soon: "warning", upcoming: "neutral" } as const;

/** Data de entrega (data + hora, horário de Brasília) e "concluída". */
export function CardDue({ cardId }: { cardId: string }) {
  const { state, meta, actions } = useBoard();
  const card = state.cards[cardId];
  const initial = card?.dueAt ? wallParts(card.dueAt) : null;
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(initial?.dayKey ?? "");
  const [time, setTime] = useState(initial?.time ?? "18:00");
  const [error, setError] = useState<string | null>(null);
  if (!card) return null;
  const status = card.dueAt ? getDueStatus(card.dueAt, card.completed) : null;

  function save(dueAt: string | null) {
    setOpen(false);
    void actions.mutate(
      (s) => patchCard(s, cardId, { dueAt }),
      () => updateCard({ id: cardId, boardId: meta.boardId, dueAt }),
    );
  }

  function submit() {
    if (!date) return setError("Escolha a data.");
    try {
      save(wallToIso(date, time || "00:00"));
      setError(null);
    } catch {
      setError("Data ou hora inválida.");
    }
  }

  function toggleCompleted(completed: boolean) {
    void actions.mutate(
      (s) => patchCard(s, cardId, { completed }),
      () => updateCard({ id: cardId, boardId: meta.boardId, completed }),
    );
  }

  return (
    <section aria-labelledby="card-due-title" className="min-w-0">
      <SectionTitle id="card-due-title">Data de entrega</SectionTitle>
      <div className="flex flex-wrap items-center gap-2">
        {card.dueAt ? (
          <>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={card.completed}
                onChange={(event) => toggleCompleted(event.target.checked)}
                className="size-4 accent-[var(--success)]"
              />
              <span className="sr-only">Marcar como concluída</span>
            </label>
            <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="rounded-md">
              <Badge variant={status ? statusVariant[status] : "neutral"} className="h-8 rounded-md text-sm">
                {formatDue(card.dueAt)}
                {status && status !== "upcoming" ? ` · ${DUE_STATUS_LABEL[status]}` : ""}
              </Badge>
            </button>
          </>
        ) : (
          <Button variant="secondary" size="sm" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            Definir data
          </Button>
        )}
      </div>
      {open ? (
        <div className="mt-2 flex w-72 max-w-full flex-col gap-3 rounded-lg border border-border bg-surface-2 p-3">
          <div className="grid grid-cols-[1fr_7rem] gap-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-muted">
              Data
              <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-9" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-muted">
              Hora
              <Input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="h-9" />
            </label>
          </div>
          {error ? <p className="text-xs font-medium text-danger">{error}</p> : null}
          <p className="text-xs text-muted">Horário de Brasília.</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={submit}>
              Salvar
            </Button>
            {card.dueAt ? (
              <Button variant="ghost" size="sm" onClick={() => save(null)}>
                Remover
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
