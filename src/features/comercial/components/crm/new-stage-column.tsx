"use client";

import { useRef, useState, useTransition, type FormEvent, type KeyboardEvent } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STAGE_LABEL_MAX } from "../../lib/stages";
import type { ActionResult } from "../../types";

type Props = {
  /** Cria a coluna depois de `afterId` (ou antes de fechado/perdido, sem ele). */
  afterId?: string;
  onCreate: (label: string, afterId?: string) => Promise<ActionResult>;
};

/**
 * "+ Nova etapa" no fim das colunas abertas (só gestores). O nome é digitado ali mesmo:
 * Enter cria, Esc cancela. A coluna aparece na hora; se o servidor recusar, some e o erro fica ao lado do campo.
 */
export function NewStageColumn({ afterId, onCreate }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputId = "nova-etapa-nome";
  const errorId = `${inputId}-erro`;

  function close() {
    setEditing(false);
    setDraft("");
    setError(null);
    requestAnimationFrame(() => buttonRef.current?.focus());
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = draft.trim();
    if (!label) {
      setError("Informe o nome da etapa.");
      return;
    }
    close();
    startTransition(async () => {
      const result = await onCreate(label, afterId);
      if (!result.ok) {
        setDraft(label);
        setError(result.fieldErrors?.label?.[0] ?? result.error);
        setEditing(true);
      }
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  }

  return (
    <div className="flex w-[17rem] shrink-0 snap-start flex-col sm:w-60">
      {editing ? (
        <form
          onSubmit={onSubmit}
          noValidate
          className="flex flex-col gap-2 rounded-xl border border-primary/50 bg-surface-2/60 p-3"
        >
          <label htmlFor={inputId} className="text-sm font-medium text-fg">
            Nome da nova etapa
          </label>
          <Input
            id={inputId}
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            maxLength={STAGE_LABEL_MAX}
            placeholder="Ex.: Proposta enviada"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="h-9"
          />
          {error ? (
            <p id={errorId} role="alert" className="text-xs font-medium text-danger">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={close}>
              Cancelar
            </Button>
            <Button type="submit" size="sm">
              Criar etapa
            </Button>
          </div>
        </form>
      ) : (
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setEditing(true)}
          aria-busy={pending || undefined}
          className="flex min-h-24 items-center justify-center gap-2 rounded-xl border border-dashed border-border px-3 py-4 text-sm font-medium text-muted transition-colors hover:border-primary/60 hover:bg-primary/5 hover:text-fg"
        >
          <Plus aria-hidden className="size-4" />
          Nova etapa
        </button>
      )}
    </div>
  );
}
