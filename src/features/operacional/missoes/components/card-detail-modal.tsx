"use client";

import { Modal } from "@/components/ui/modal";
import { useBoard } from "./board-context";
import { CardChecklist } from "./card-checklist";
import { CardDangerActions } from "./card-danger-actions";
import { CardDescription } from "./card-description";
import { CardDue } from "./card-due";
import { CardLabels } from "./card-labels";
import { CardMembers } from "./card-members";
import { CardMove } from "./card-move";
import { CardTitleEditor } from "./card-title-editor";

/** Detalhes do cartão no estilo Trello: conteúdo à esquerda, ações à direita. */
export function CardDetailModal() {
  const { state, ui, actions } = useBoard();
  const card = ui.openCardId ? state.cards[ui.openCardId] : undefined;
  const listName = card ? state.lists[card.listId]?.name : undefined;

  return (
    <Modal
      open={Boolean(card)}
      onClose={() => actions.openCard(null)}
      size="xl"
      title={card ? <CardTitleEditor key={card.id} cardId={card.id} /> : "Cartão"}
      description={listName ? `na lista ${listName}` : undefined}
    >
      {card ? (
        <div className="grid gap-6 md:grid-cols-[1fr_200px]">
          <div className="flex min-w-0 flex-col gap-6">
            <div className="flex flex-wrap gap-6">
              <CardMembers cardId={card.id} />
              <CardLabels cardId={card.id} />
              <CardDue key={`${card.id}-${card.dueAt}`} cardId={card.id} />
            </div>
            <CardDescription key={card.id} cardId={card.id} />
            <CardChecklist cardId={card.id} />
          </div>
          <aside className="flex flex-col gap-4" aria-label="Ações do cartão">
            <CardMove key={card.id} cardId={card.id} />
            <CardDangerActions cardId={card.id} />
          </aside>
        </div>
      ) : null}
    </Modal>
  );
}
