"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { RowMenu } from "./row-menu";

/**
 * Linha arrastável para cima ou para baixo. A alça ⋮⋮ fica no começo da linha (primeira
 * célula, recebida em `children(grip)`); só ela arrasta, então as células seguem editáveis.
 * `done`: linha marcada como concluída, pintada de verde-claro.
 */
export function SortableRow({
  rowId,
  index,
  label,
  done,
  children,
}: {
  rowId: string;
  index: number;
  label: string;
  done: boolean;
  children: (grip: ReactNode) => ReactNode;
}) {
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, transform, transition, isDragging } = useSortable({
    id: rowId,
    data: { title: label },
  });

  const grip = (
    <button
      ref={setActivatorNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      aria-roledescription="linha arrastável"
      aria-label={`Mover a linha ${label}`}
      className="absolute top-1/2 left-0.5 z-10 grid size-6 -translate-y-1/2 touch-none cursor-grab place-items-center rounded text-muted opacity-40 group-hover/row:opacity-100 hover:bg-surface-3 hover:text-fg focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-ring"
    >
      <GripVertical aria-hidden className="size-3.5" />
    </button>
  );

  return (
    <tr
      ref={setNodeRef}
      data-row-index={index}
      style={{ transform: CSS.Translate.toString(transform && { ...transform, x: 0 }), transition }}
      className={cn(
        "group/row relative hover:bg-surface-2/40",
        // As células têm fundo próprio (a primeira é fixa e opaca): o verde vai em cada uma.
        done && "[&>*]:bg-[color-mix(in_oklab,var(--color-success)_14%,var(--color-surface))]!",
        isDragging && "z-40 bg-surface opacity-90 ring-2 ring-ring",
      )}
    >
      {children(grip)}
      <td className="border-b border-l border-border p-0">
        <div className="flex items-center justify-center">
          <RowMenu rowId={rowId} label={label} />
        </div>
      </td>
    </tr>
  );
}
