"use client";

import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { ResetWeekButton } from "./reset-week-button";
import { useSheet } from "./sheet-context";
import { useSheetCommands } from "./use-sheet-commands";

/** Nome e descrição editáveis no lugar (salvam ao sair do campo; Esc desfaz). */
export function SheetHeader() {
  const { state } = useSheet();
  const commands = useSheetCommands();
  const { sheet } = state;
  const [editing, setEditing] = useState<"name" | "description" | null>(null);
  const [draft, setDraft] = useState("");
  const [hideDescription, setHideDescription] = useState(false);
  const cancelled = useRef(false);
  // Depois de Enter/Esc o foco volta ao botão que abriu a edição (montado de novo).
  const focusBack = useRef<"name" | "description" | null>(null);
  const refocus = (field: "name" | "description") => (element: HTMLButtonElement | null) => {
    if (element && focusBack.current === field) {
      focusBack.current = null;
      element.focus();
    }
  };

  function start(field: "name" | "description") {
    cancelled.current = false;
    setDraft(field === "name" ? sheet.name : sheet.description);
    setEditing(field);
  }

  function commit() {
    const field = editing;
    setEditing(null);
    if (cancelled.current) {
      cancelled.current = false;
      return;
    }
    if (!field) return;
    const value = draft.trim();
    if (field === "name" && (!value || value === sheet.name)) return;
    if (field === "description" && value === sheet.description) return;
    void commands.updateSheet({ [field]: value });
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelled.current = true;
      focusBack.current = editing;
      event.currentTarget.blur();
      setEditing(null);
      return;
    }
    if (event.key === "Enter" && (editing === "name" || !event.shiftKey)) {
      event.preventDefault();
      focusBack.current = editing;
      event.currentTarget.blur(); // o blur salva (uma vez só)
    }
  }

  return (
    <header className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Link
          href="/operacional/relatorios"
          aria-label="Voltar para as tabelas"
          className="grid size-9 shrink-0 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
        >
          <ArrowLeft aria-hidden className="size-4" />
        </Link>
        {editing === "name" ? (
          <input
            autoFocus
            aria-label="Nome da tabela"
            value={draft}
            maxLength={120}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={onKeyDown}
            className="h-10 min-w-0 flex-1 rounded-md border border-ring bg-surface px-2 text-2xl font-semibold text-fg outline-none"
          />
        ) : (
          <h1 className="min-w-0">
            <button
              type="button"
              ref={refocus("name")}
              onClick={() => start("name")}
              title="Renomear tabela"
              className="max-w-full truncate rounded-md px-2 py-0.5 text-left text-2xl font-semibold tracking-tight text-fg hover:bg-surface-2"
            >
              {sheet.name}
            </button>
          </h1>
        )}
        <span className="ml-auto" />
        {sheet.canReset ? <ResetWeekButton /> : null}
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={hideDescription}
          onClick={() => setHideDescription((value) => !value)}
        >
          {hideDescription ? <Eye aria-hidden /> : <EyeOff aria-hidden />}
          {hideDescription ? "Mostrar descrição" : "Ocultar descrição"}
        </Button>
      </div>
      {hideDescription ? null : editing === "description" ? (
        <textarea
          autoFocus
          aria-label="Descrição da tabela"
          value={draft}
          rows={2}
          maxLength={1000}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={onKeyDown}
          className="ml-11 rounded-md border border-ring bg-surface px-2 py-1 text-sm text-fg outline-none"
        />
      ) : (
        <button
          type="button"
          ref={refocus("description")}
          onClick={() => start("description")}
          title="Editar descrição"
          className="ml-11 max-w-3xl rounded-md px-2 py-1 text-left text-sm whitespace-pre-line text-muted hover:bg-surface-2"
        >
          {sheet.description || <span className="text-muted/60">Adicionar descrição…</span>}
        </button>
      )}
    </header>
  );
}
