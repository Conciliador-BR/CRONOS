"use client";

import { AlignLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateCard } from "../card-actions";
import { patchCard } from "../board-state";
import { useBoard } from "./board-context";
import { SectionTitle } from "./section-title";

export function CardDescription({ cardId }: { cardId: string }) {
  const { state, meta, actions } = useBoard();
  const description = state.cards[cardId]?.description ?? "";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(description);

  function save() {
    setEditing(false);
    if (draft === description) return;
    void actions.mutate(
      (s) => patchCard(s, cardId, { description: draft }),
      () => updateCard({ id: cardId, boardId: meta.boardId, description: draft }),
    );
  }

  return (
    <section aria-labelledby="card-description-title">
      <div className="flex items-center gap-2">
        <AlignLeft aria-hidden className="mb-2 size-4 text-muted" />
        <SectionTitle id="card-description-title">Descrição</SectionTitle>
        {!editing && description ? (
          <Button variant="secondary" size="sm" className="mb-2 ml-auto" onClick={() => { setDraft(description); setEditing(true); }}>
            Editar
          </Button>
        ) : null}
      </div>
      {editing ? (
        <div className="flex flex-col gap-2">
          <Textarea
            autoFocus
            aria-label="Descrição do cartão"
            rows={6}
            maxLength={20000}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Adicione uma descrição mais detalhada…"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={save}>
              Salvar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setDraft(description); setEditing(false); }}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : description ? (
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-fg">{description}</p>
      ) : (
        <button
          type="button"
          onClick={() => { setDraft(""); setEditing(true); }}
          className="min-h-16 w-full rounded-lg bg-surface-2 px-3 py-2 text-left text-sm text-muted hover:bg-surface-3"
        >
          Adicione uma descrição mais detalhada…
        </button>
      )}
    </section>
  );
}
