"use client";

import { useImperativeHandle, useRef, useState, useTransition, type KeyboardEvent, type Ref } from "react";
import { Input } from "@/components/ui/input";
import { STAGE_LABEL_MAX } from "../../lib/stages";
import type { ActionResult } from "../../types";

export type RenameStage = (stageId: string, label: string) => Promise<ActionResult>;

/** Abre o campo de nome (chamado pelo item "Renomear" do menu da coluna). */
export type StageTitleHandle = { startEditing: () => void };

type Props = {
  stageId: string;
  label: string;
  headingId: string;
  /** Só admin/gestor recebem `onRename`; sem ele, o título não é editável. */
  onRename?: RenameStage;
  /** Para onde o foco volta ao fechar o campo com Enter/Esc (o botão do menu da coluna). */
  onReturnFocus?: () => void;
  ref?: Ref<StageTitleHandle>;
};

/**
 * Título da coluna. Gestores renomeiam pelo menu da coluna, ali mesmo: Enter ou sair do campo
 * salva, Esc cancela. Se o servidor recusar, o nome volta e o erro aparece ao lado do campo.
 */
export function StageTitle({ stageId, label, headingId, onRename, onReturnFocus, ref }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  /** Evita salvar de novo no blur depois de Enter/Esc já terem fechado o campo. */
  const closingRef = useRef(false);
  const errorId = `${headingId}-erro`;

  function open() {
    closingRef.current = false;
    setDraft(label);
    setError(null);
    setEditing(true);
  }

  useImperativeHandle(ref, () => ({ startEditing: open }));

  function close(returnFocus: boolean) {
    closingRef.current = true;
    setEditing(false);
    if (returnFocus && onReturnFocus) requestAnimationFrame(onReturnFocus);
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
      const result = await onRename(stageId, next);
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
    </>
  );
}
