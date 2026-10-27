"use client";

import { NotebookPen, Plus } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { formatShortDate } from "../../shared/tz";
import { createNote, deleteNote } from "../note-actions";
import type { AcquirerNote } from "../types";
import { NoteEditor } from "./note-editor";

/** Bloco de notas estilo Notion: lista à esquerda, página editável à direita. */
export function NotesWorkspace({ acquirerId, initialNotes }: { acquirerId: string; initialNotes: AcquirerNote[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [selectedId, setSelectedId] = useState<string | null>(initialNotes[0]?.id ?? null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selected = notes.find((note) => note.id === selectedId) ?? null;

  async function add() {
    setPending(true);
    const result = await createNote(acquirerId);
    setPending(false);
    if (!result.ok) return setError(result.error);
    setError(null);
    setNotes((list) => [result.note, ...list]);
    setSelectedId(result.note.id);
  }

  async function remove(id: string) {
    const before = notes;
    const rest = notes.filter((note) => note.id !== id);
    setNotes(rest);
    setSelectedId(rest[0]?.id ?? null);
    const result = await deleteNote(id);
    if (!result.ok) {
      setNotes(before);
      setSelectedId(id);
      setError(result.error);
    }
  }

  function onSaved(id: string, patch: Partial<AcquirerNote>) {
    setNotes((list) => list.map((note) => (note.id === id ? { ...note, ...patch } : note)));
  }

  return (
    <section aria-labelledby="notes-title" className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
        <h2 id="notes-title" className="flex-1 text-base font-semibold">Notas</h2>
        <Button variant="secondary" size="sm" loading={pending} onClick={add}>
          {pending ? null : <Plus aria-hidden />}
          Nova nota
        </Button>
      </div>
      {error ? <Alert tone="danger" className="m-4">{error}</Alert> : null}
      {notes.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          className="m-4"
          title="Nenhuma nota ainda"
          description="Anote endpoints, credenciais de homologação (sem senhas reais), contatos e decisões."
          action={<Button onClick={add} loading={pending}>Criar a primeira nota</Button>}
        />
      ) : (
        <div className="grid min-h-[420px] md:grid-cols-[240px_1fr]">
          <nav aria-label="Lista de notas" className="border-b border-border p-2 md:border-r md:border-b-0">
            <ul className="flex max-h-48 flex-col gap-0.5 overflow-y-auto md:max-h-[560px]">
              {notes.map((note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(note.id)}
                    aria-current={note.id === selectedId ? "true" : undefined}
                    className={cn(
                      "flex w-full flex-col rounded-md px-3 py-2 text-left transition-colors",
                      note.id === selectedId ? "bg-primary/15 text-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
                    )}
                  >
                    <span className="truncate text-sm font-medium">{note.title.trim() || "Sem título"}</span>
                    <span className="text-xs text-muted">{formatShortDate(note.updatedAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          {selected ? (
            <NoteEditor key={selected.id} note={selected} onSaved={onSaved} onDelete={() => remove(selected.id)} />
          ) : (
            <p className="p-6 text-sm text-muted">Escolha uma nota.</p>
          )}
        </div>
      )}
    </section>
  );
}
