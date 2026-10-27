"use client";

import { useRef, useState, useTransition, type KeyboardEvent } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PipelineStage } from "../../constants";
import { STAGE_LABEL_MAX } from "../../lib/stage-labels";
import type { ActionResult } from "../../types";

export type RenameStage = (stage: PipelineStage, label: string) => Promise<ActionResult>;

type Props = {
  stage: PipelineStage;
  label: string;
  headingId: string;
  /** Só admin/gestor recebem `onRename`; sem ele, nada de botão de renomear. */
  onRename?: RenameStage;
};

/**
 * Título da coluna. Gestores clicam no lápis para renomear a etapa ali mesmo:
 * Enter ou sair do campo salva, Esc cancela. Se o servidor recusar, o nome volta e o erro aparece ao lado do campo.
 */
export function StageTitle({ stage, label, headingId, onRename }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const buttonRef = useRef<HTMLButtonElement>(null);
  /** Evita salvar de novo no blur depois de Enter/Esc já terem fechado o campo. */
  const closingRef = useRef(false);
  const errorId = `${headingId}-erro`;

  function open() {
    closingRef.current = false;
    setDraft(label);
    setError(null);
    setEditing(true);
  }

  function close(returnFocus: boolean) {
    closingRef.current = true;
    setEditing(false);
    if (returnFocus) requestAnimationFrame(() => buttonRef.current?.focus());
  }

  function cancel() {
    setError(null);
    close(true);
  }

  function save(returnFocus: boolean) {
    if (!onRename) return;
    const next = draft.trim();
    if (!next) {
      setError("Informe o nome da etapa.");
      return;
    }
    setError(null);
    close(returnFocus);
    if (next === label) return;
    startTransition(async () => {
      const result = await onRename(stage, next);
      if (!result.ok) {
        closingRef.current = false;
        setDraft(next);
        setError(result.fieldErrors?.label?.[0] ?? result.error);
        setEditing(true);
      }
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      save(true);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      cancel();
    }
  }

  if (editing && onRename) {
    return (
      <>
        <h2 id={headingId} className="sr-only">
          {label}
        </h2>
        <Input
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (!closingRef.current) save(false);
          }}
          maxLength={STAGE_LABEL_MAX}
          aria-label={`Novo nome da etapa ${label}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-8 min-w-0 flex-1 px-2"
        />
        {error ? (
          <p id={errorId} role="alert" className="order-last basis-full text-xs text-danger">
            {error}
          </p>
        ) : null}
      </>
    );
  }

  return (
    <>
      <h2
        id={headingId}
        aria-busy={pending || undefined}
        className="min-w-0 flex-1 truncate text-sm font-semibold text-fg aria-busy:opacity-60"
        title={label}
      >
        {label}
      </h2>
      {onRename ? (
        <Button
          ref={buttonRef}
          variant="ghost"
          size="icon"
          onClick={open}
          aria-label={`Renomear etapa ${label}`}
          title="Renomear etapa"
          className="size-7 [&_svg]:size-3.5"
        >
          <Pencil aria-hidden />
        </Button>
      ) : null}
    </>
  );
}
