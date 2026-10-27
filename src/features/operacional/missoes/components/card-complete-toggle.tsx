import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Círculo verde com check (cartão concluído). Só visual. */
export function CompletedMark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("grid size-6 shrink-0 place-items-center", className)}>
      <span className="grid size-4 place-items-center rounded-full bg-success text-bg">
        <Check className="size-3" strokeWidth={3} />
      </span>
    </span>
  );
}

/**
 * Bolinha "Marcar como concluída" no estilo Trello: aparece ao passar o mouse ou focar o cartão
 * (sempre em telas de toque) e fica visível quando o cartão está concluído.
 * Não propaga ponteiro, teclado nem clique: não inicia arrasto nem abre o cartão.
 */
export function CardCompleteToggle({ completed, onToggle }: { completed: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={completed}
      aria-label="Marcar como concluída"
      title={completed ? "Marcar como não concluída" : "Marcar como concluída"}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className={cn(
        "pointer-events-auto grid h-6 shrink-0 place-items-center overflow-hidden rounded-full transition-[width,opacity,margin] motion-reduce:transition-none",
        "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring",
        completed
          ? "mr-1 w-6 opacity-100"
          : "w-0 opacity-0 group-focus-within/card:mr-1 group-focus-within/card:w-6 group-focus-within/card:opacity-100 group-hover/card:mr-1 group-hover/card:w-6 group-hover/card:opacity-100 [@media(hover:none)]:mr-1 [@media(hover:none)]:w-6 [@media(hover:none)]:opacity-100",
      )}
    >
      {completed ? (
        <span className="grid size-4 place-items-center rounded-full bg-success text-bg">
          <Check aria-hidden className="size-3" strokeWidth={3} />
        </span>
      ) : (
        <span className="size-4 rounded-full border-2 border-muted hover:border-success" />
      )}
    </button>
  );
}
