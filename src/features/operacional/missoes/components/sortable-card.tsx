"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { useBoard } from "./board-context";
import { CardFace } from "./card-face";

export const TEMP_PREFIX = "tmp-";

/** Cartão arrastável. Clique ou Enter abre os detalhes; Espaço pega para arrastar. */
export function SortableCard({ id }: { id: string }) {
  const { state, meta, actions } = useBoard();
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
      className={cn("list-none", isDragging && "opacity-40")}
    >
      <div
        {...attributes}
        {...listeners}
        onKeyDown={onKeyDown}
        onClick={() => !pending && actions.openCard(id)}
        aria-roledescription="cartão arrastável"
        aria-label={card.title}
        aria-disabled={pending || undefined}
        className={cn(
          "block w-full cursor-pointer touch-manipulation rounded-lg",
          "hover:[&>div]:border-primary/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          pending && "cursor-progress opacity-70",
        )}
      >
        <CardFace card={card} labels={labels} assignees={assignees} />
      </div>
    </li>
  );
}
