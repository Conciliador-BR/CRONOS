"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { AddCardForm } from "./add-card-form";
import { useBoard } from "./board-context";
import { ListHeader } from "./list-header";
import { SortableCard } from "./sortable-card";

export const BODY_PREFIX = "body:";

/** Coluna (lista) arrastável com seus cartões. */
export function BoardColumn({ listId }: { listId: string }) {
  const { state } = useBoard();
  const list = state.lists[listId];
  const cardIds = state.columns[listId] ?? [];
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: listId,
    data: { type: "list", title: list?.name },
  });
  const { setNodeRef: setBodyRef, isOver } = useDroppable({
    id: `${BODY_PREFIX}${listId}`,
    data: { type: "list-body", listId, title: list?.name },
  });

  return (
    <section
      ref={setNodeRef}
      aria-label={`Lista ${list?.name ?? ""}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "flex max-h-full w-[272px] shrink-0 flex-col rounded-xl bg-surface/95 py-2 shadow-lg shadow-black/30 ring-1 ring-white/5",
        isDragging && "opacity-40",
      )}
    >
      <ListHeader listId={listId} handle={{ handleRef: setActivatorNodeRef, ...attributes, ...listeners }} />
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <ol
          ref={setBodyRef}
          className={cn(
            "mt-1 flex min-h-2 flex-col gap-2 overflow-y-auto px-2 pb-1",
            isOver && cardIds.length === 0 && "min-h-12 rounded-lg bg-primary/10",
          )}
        >
          {cardIds.map((cardId) => (
            <SortableCard key={cardId} id={cardId} />
          ))}
        </ol>
      </SortableContext>
      <div className="px-2 pt-1">
        <AddCardForm listId={listId} />
      </div>
    </section>
  );
}
