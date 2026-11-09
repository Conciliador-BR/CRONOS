"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { KeyboardEventHandler, PointerEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ReportProperty } from "../types";

/**
 * Cabeçalho arrastável (como no Excel): o mouse arrasta o cabeçalho inteiro (5 px antes de
 * começar, então o clique ainda abre o menu); o teclado usa a alça (Espaço, setas, Espaço).
 */
export function SortableHeader({
  property,
  className,
  children,
}: {
  property: ReportProperty;
  className?: string;
  children: ReactNode;
}) {
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, transform, transition, isDragging } = useSortable({
    id: property.id,
    data: { title: property.name },
  });

  // O mouse ativa pelo <th>; o teclado só pela alça (Espaço no botão do menu abre o menu).
  const { onPointerDown: startPointer, onKeyDown: startKeyboard } = (listeners ?? {}) as {
    onPointerDown?: (event: PointerEvent<HTMLTableCellElement>) => void;
    onKeyDown?: KeyboardEventHandler<HTMLButtonElement>;
  };

  function onPointerDown(event: PointerEvent<HTMLTableCellElement>) {
    // O painel da coluna (popover) é filho do <th>: selecionar texto nele não arrasta.
    if (event.target instanceof Element && event.target.closest("[popover]")) return;
    startPointer?.(event);
  }

  return (
    <th
      ref={setNodeRef}
      scope="col"
      onPointerDown={onPointerDown}
      style={{ transform: CSS.Translate.toString(transform && { ...transform, y: 0 }), transition }}
      className={cn("group/col relative touch-none", isDragging && "z-40 opacity-80 ring-2 ring-ring", className)}
    >
      {children}
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        onKeyDown={startKeyboard}
        aria-roledescription="coluna arrastável"
        aria-label={`Mover a coluna ${property.name}`}
        className="absolute top-1/2 right-0.5 flex size-6 -translate-y-1/2 cursor-grab items-center justify-center rounded text-muted opacity-0 group-hover/col:opacity-100 hover:text-fg focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-ring"
      >
        <GripVertical aria-hidden className="size-3.5" />
      </button>
    </th>
  );
}
