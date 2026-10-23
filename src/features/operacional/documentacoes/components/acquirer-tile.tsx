"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { AcquirerSummary } from "../types";
import { AcquirerLogo } from "./acquirer-logo";

export function AcquirerTile({
  acquirer,
  canManage,
  onEdit,
}: {
  acquirer: AcquirerSummary;
  canManage: boolean;
  onEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: acquirer.id,
    disabled: !canManage,
    data: { title: acquirer.name },
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("group relative", isDragging && "z-10 opacity-60")}
    >
      <Link
        href={`/operacional/documentacoes/${acquirer.id}`}
        className="flex h-full flex-col items-center gap-3 rounded-xl border border-border bg-surface p-4 text-center transition-colors hover:border-primary/60 hover:bg-surface-2"
      >
        <AcquirerLogo name={acquirer.name} color={acquirer.color} logoUrl={acquirer.logoUrl} className="aspect-[4/3] w-full text-3xl" />
        <span className="w-full truncate font-semibold text-fg">{acquirer.name}</span>
        <span className="text-xs text-muted">
          {acquirer.documentCount} {acquirer.documentCount === 1 ? "documento" : "documentos"} · {acquirer.noteCount}{" "}
          {acquirer.noteCount === 1 ? "nota" : "notas"}
        </span>
      </Link>
      {canManage ? (
        <div className="absolute top-2 right-2 flex gap-1 opacity-90 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
          <button
            ref={setActivatorNodeRef}
            type="button"
            aria-label={`Reordenar ${acquirer.name}`}
            className="grid size-8 cursor-grab touch-none place-items-center rounded-md bg-black/50 text-white hover:bg-black/70 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Editar ${acquirer.name}`}
            className="grid size-8 place-items-center rounded-md bg-black/50 text-white hover:bg-black/70"
          >
            <Pencil aria-hidden className="size-4" />
          </button>
        </div>
      ) : null}
    </li>
  );
}
