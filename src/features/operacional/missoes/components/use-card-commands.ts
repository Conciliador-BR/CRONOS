"use client";

import { updateCard } from "../card-actions";
import { patchCard, removeCard } from "../board-state";
import { useBoard } from "./board-context";

/** Ações rápidas do cartão (concluir e arquivar) com atualização otimista. */
export function useCardCommands(cardId: string) {
  const { state, meta, actions } = useBoard();

  function setCompleted(completed: boolean) {
    return actions.mutate(
      (s) => patchCard(s, cardId, { completed }),
      () => updateCard({ id: cardId, boardId: meta.boardId, completed }),
    );
  }

  return {
    setCompleted,
    toggleCompleted: () => setCompleted(!state.cards[cardId]?.completed),
    archive: () => {
      actions.openCard(null);
      return actions.mutate(
        (s) => removeCard(s, cardId),
        () => updateCard({ id: cardId, boardId: meta.boardId, archived: true }),
      );
    },
  };
}
