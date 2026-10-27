"use client";

import { Check, CloudOff, LoaderCircle, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { updateNote } from "../note-actions";
import type { AcquirerNote } from "../types";

const DELAY = 800;
type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

/** Página da nota com salvamento automático (debounce) e indicador "Salvo". */
export function NoteEditor({
  note,
  onSaved,
  onDelete,
}: {
  note: AcquirerNote;
  onSaved: (id: string, patch: Partial<AcquirerNote>) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [state, setState] = useState<SaveState>("idle");
  const [confirming, setConfirming] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ title: note.title, content: note.content, dirty: false });

  async function save() {
    timer.current = null;
    const { title: t, content: c } = latest.current;
    latest.current.dirty = false;
    setState("saving");
    const result = await updateNote({ id: note.id, title: t, content: c });
    if (!result.ok) {
      latest.current.dirty = true;
      return setState("error");
    }
    onSaved(note.id, { title: t, content: c, updatedAt: result.updatedAt });
    setState(latest.current.dirty ? "dirty" : "saved");
  }

  function schedule(next: { title?: string; content?: string }) {
    latest.current = { ...latest.current, ...next, dirty: true };
    setState("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, DELAY);
  }

  // Ao trocar de nota ou sair da página, grava o que ficou pendente.
  useEffect(() => {
    const pending = latest;
    const pendingTimer = timer;
    const id = note.id;
    return () => {
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
      if (pending.current.dirty) void updateNote({ id, title: pending.current.title, content: pending.current.content });
    };
  }, [note.id]);

  return (
    <article className="flex min-w-0 flex-col p-4 sm:p-6">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted">
        <SaveIndicator state={state} onRetry={save} />
        <span className="ml-auto" />
        {confirming ? (
          <span className="flex items-center gap-2" role="group" aria-label="Confirmar exclusão da nota">
            <span className="text-fg">Excluir nota?</span>
            <Button variant="danger" size="sm" onClick={onDelete}>Excluir</Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>Cancelar</Button>
          </span>
        ) : (
          <Button variant="ghost" size="sm" className="hover:text-danger" onClick={() => setConfirming(true)}>
            <Trash2 aria-hidden />
            Excluir
          </Button>
        )}
      </div>
      <input
        aria-label="Título da nota"
        value={title}
        maxLength={200}
        placeholder="Sem título"
        onChange={(event) => {
          setTitle(event.target.value);
          schedule({ title: event.target.value });
        }}
        className="mb-3 w-full bg-transparent text-2xl font-bold tracking-tight text-fg placeholder:text-muted/60 focus-visible:outline-none"
      />
      <textarea
        aria-label="Conteúdo da nota"
        value={content}
        maxLength={100000}
        placeholder="Comece a escrever…"
        onChange={(event) => {
          setContent(event.target.value);
          schedule({ content: event.target.value });
        }}
        className="min-h-[340px] w-full flex-1 resize-y bg-transparent text-[15px] leading-7 text-fg placeholder:text-muted/60 focus-visible:outline-none"
      />
      <p className="mt-2 text-xs text-muted">Última edição por {note.updatedByName}.</p>
    </article>
  );
}

function SaveIndicator({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  return (
    <span role="status" aria-live="polite" className="inline-flex items-center gap-1.5">
      {state === "saving" || state === "dirty" ? (
        <>
          <LoaderCircle aria-hidden className="size-3.5 motion-safe:animate-spin" />
          Salvando…
        </>
      ) : state === "saved" ? (
        <>
          <Check aria-hidden className="size-3.5 text-success" />
          Salvo
        </>
      ) : state === "error" ? (
        <>
          <CloudOff aria-hidden className="size-3.5 text-danger" />
          <span className="text-danger">Não salvo.</span>
          <button type="button" onClick={onRetry} className="underline hover:text-fg">Tentar de novo</button>
        </>
      ) : null}
    </span>
  );
}
