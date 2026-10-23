"use client";

import { memo, type KeyboardEventHandler } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemberOption, PipelineLead } from "../../types";
import { LeadCardContent } from "./lead-card";

type Props = {
  lead: PipelineLead;
  owner: MemberOption | undefined;
  canEdit: boolean;
  onOpen: (leadId: string) => void;
};

/**
 * Card arrastável. Mouse/toque arrastam o card inteiro (clique simples abre a gaveta);
 * pelo teclado, a alça ⋮⋮ começa o arraste (Espaço/Enter) e o corpo do card abre a gaveta.
 */
export const SortableLeadCard = memo(function SortableLeadCard({ lead, owner, canEdit, onOpen }: Props) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    disabled: !canEdit,
    attributes: { roleDescription: "card arrastável" },
  });
  const { onKeyDown, ...pointerListeners } = listeners ?? {};

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "group relative flex touch-manipulation items-stretch rounded-lg border border-border bg-surface shadow-sm shadow-black/30 transition-colors hover:border-surface-3",
        isDragging && "opacity-40",
      )}
      {...pointerListeners}
    >
      <button
        type="button"
        onClick={() => onOpen(lead.id)}
        className="min-w-0 flex-1 rounded-lg p-3 text-left focus-visible:outline-offset-[-2px]"
      >
        <LeadCardContent lead={lead} owner={owner} />
      </button>
      {canEdit ? (
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          onKeyDown={onKeyDown as KeyboardEventHandler<HTMLButtonElement> | undefined}
          aria-label={`Mover ${lead.name}`}
          className="flex w-7 shrink-0 cursor-grab items-start justify-center rounded-r-lg pt-3 text-muted hover:bg-surface-2 hover:text-fg focus-visible:outline-offset-[-2px] active:cursor-grabbing"
        >
          <GripVertical aria-hidden className="size-4" />
        </button>
      ) : null}
    </li>
  );
});
