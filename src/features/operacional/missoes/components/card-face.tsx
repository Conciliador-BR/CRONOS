import { AlignLeft, CheckSquare, Clock } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Member } from "../../shared/types";
import { DUE_STATUS_LABEL, formatDue, getDueStatus } from "../due";
import type { BoardCard, BoardLabel } from "../types";

const dueTone = {
  completed: "bg-success/20 text-success",
  overdue: "bg-danger/20 text-danger",
  soon: "bg-warning/20 text-warning",
  upcoming: "text-muted",
} as const;

/** Visual do cartão (sem interação), usado na lista e na sobreposição do arrasto. */
export function CardFace({
  card,
  labels,
  assignees,
  className,
}: {
  card: BoardCard;
  labels: BoardLabel[];
  assignees: Member[];
  className?: string;
}) {
  const doneCount = card.checklist.filter((item) => item.done).length;
  const total = card.checklist.length;
  const status = card.dueAt ? getDueStatus(card.dueAt, card.completed) : null;

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface-2 px-3 py-2 text-left shadow-sm shadow-black/30",
        className,
      )}
    >
      {labels.length > 0 ? (
        <ul className="mb-1.5 flex flex-wrap gap-1" aria-label="Etiquetas">
          {labels.map((label) => (
            <li key={label.id} title={label.name || undefined}>
              <span className="block h-2 w-10 rounded-full" style={{ backgroundColor: label.color }} aria-hidden />
              <span className="sr-only">{label.name || "Etiqueta sem nome"}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-sm break-words text-fg">{card.title}</p>
      {status || card.description || total > 0 || assignees.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {status && card.dueAt ? (
            <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium", dueTone[status])}>
              <Clock aria-hidden className="size-3.5" />
              <span>{formatDue(card.dueAt)}</span>
              <span className="sr-only">({DUE_STATUS_LABEL[status]})</span>
            </span>
          ) : null}
          {card.description ? (
            <span className="text-muted" title="Este cartão tem descrição">
              <AlignLeft aria-hidden className="size-3.5" />
              <span className="sr-only">Tem descrição</span>
            </span>
          ) : null}
          {total > 0 ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded px-1.5 py-0.5",
                doneCount === total ? "bg-success/20 text-success" : "text-muted",
              )}
            >
              <CheckSquare aria-hidden className="size-3.5" />
              <span className="tabular-nums">
                {doneCount}/{total}
              </span>
              <span className="sr-only">itens do checklist concluídos</span>
            </span>
          ) : null}
          {assignees.length > 0 ? (
            <span className="ml-auto flex -space-x-1.5">
              {assignees.slice(0, 4).map((member) => (
                <Avatar key={member.id} name={member.name} src={member.avatarUrl} size="xs" />
              ))}
              {assignees.length > 4 ? (
                <span className="grid size-6 place-items-center rounded-full bg-surface-3 text-[10px] text-fg ring-1 ring-border">
                  +{assignees.length - 4}
                </span>
              ) : null}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
