"use client";

import { Archive, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteCard, updateCard } from "../card-actions";
import { removeCard } from "../board-state";
import { useBoard } from "./board-context";

/** Arquivar (some do quadro, pode ser restaurado) e excluir (com confirmação). */
export function CardDangerActions({ cardId }: { cardId: string }) {
  const { meta, actions } = useBoard();
  const [confirming, setConfirming] = useState(false);

  async function archive() {
    actions.openCard(null);
    await actions.mutate(
      (s) => removeCard(s, cardId),
      () => updateCard({ id: cardId, boardId: meta.boardId, archived: true }),
    );
  }

  async function remove() {
    actions.openCard(null);
    await actions.mutate((s) => removeCard(s, cardId), () => deleteCard({ id: cardId, boardId: meta.boardId }));
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="secondary" size="sm" className="w-full justify-start" onClick={archive}>
        <Archive aria-hidden />
        Arquivar
      </Button>
      {confirming ? (
        <div role="group" aria-label="Confirmar exclusão" className="flex flex-col gap-2 rounded-lg border border-danger/40 bg-danger/10 p-3">
          <p className="text-xs text-fg">Excluir o cartão e tudo nele? Isso não pode ser desfeito.</p>
          <div className="flex gap-2">
            <Button variant="danger" size="sm" onClick={remove}>
              Excluir
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" size="sm" className="w-full justify-start hover:text-danger" onClick={() => setConfirming(true)}>
          <Trash2 aria-hidden />
          Excluir
        </Button>
      )}
    </div>
  );
}
