"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { useBoard } from "./board-context";
import { CardCompleteToggle } from "./card-complete-toggle";
import { CardFace } from "./card-face";
import { CardQuickMenu } from "./card-quick-menu";
import { useCardCommands } from "./use-card-commands";

export const TEMP_PREFIX = "tmp-";

/**
 * Cartão arrastável. Clique ou Enter abre os detalhes; Espaço pega para arrastar.
 * A superfície de arrasto/abrir fica atrás do visual; a bolinha de concluir e o menu "…"
 * são irmãos dela (não ficam aninhados num botão) e não iniciam arrasto.
 */
export function SortableCard({ id }: { id: string }) {
  const { state, meta, actions } = useBoard();
  const commands = useCardCommands(id);
  const card = state.cards[id];
  const pending = id.startsWith(TEMP_PREFIX);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: pending,
    data: { type: "card", listId: card?.listId, title: card?.title },
  });
  if (!card) return null;

  const labels = card.labelIds.flatMap((labelId) => meta.labelsById.get(labelId) ?? []);
  const assignees = card.assigneeIds.flatMap((memberId) => meta.membersById.get(memberId) ?? []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" && !isDragging) {
      event.preventDefault();
      actions.openCard(id);
      return;
    }
    listeners?.onKeyDown?.(event);
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("group/card relative list-none", isDragging && "opacity-40", pending && "opacity-70")}
    >
      <div
        {...attributes}
        {...listeners}
        onKeyDown={onKeyDown}
        onClick={() => !pending && actions.openCard(id)}
        aria-roledescription="cartão arrastável"
        aria-label={card.completed ? `${card.title} (concluída)` : card.title}
        aria-disabled={pending || undefined}
        className={cn(
          "absolute inset-0 cursor-pointer touch-manipulation rounded-lg",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          pending && "cursor-progress",
        )}
      />
      <CardFace
        card={card}
        labels={labels}
        assignees={assignees}
        className="pointer-events-none group-hover/card:border-primary/60"
        leading={pending ? undefined : <CardCompleteToggle completed={card.completed} onToggle={commands.toggleCompleted} />}
        menu={pending ? undefined : <CardQuickMenu cardId={id} />}
      />
    </li>
  );
}
