"use client";

import { Building2, CircleCheck, Plus, Search } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { PROPERTY_TYPE_LABELS } from "../options";
import { PROPERTY_TYPES, type PropertyType } from "../types";
import { CompanySyncDialog } from "./company-sync-dialog";
import { PROPERTY_TYPE_ICONS } from "./property-icons";
import { useSheet } from "./sheet-context";
import { onRovingKeyDown, useAnchoredPopover } from "./use-anchored-popover";
import { useSheetCommands } from "./use-sheet-commands";

const WIDTH = 360;
const DONE_LABEL = "Concluído";

function normalize(text: string) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

const itemClass =
  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-fg hover:bg-surface-3 focus-visible:bg-surface-3 focus-visible:outline-none";

/** "+" do fim do cabeçalho: painel "Selecionar tipo" com busca, em duas colunas; Empresa em destaque. */
export function PropertyTypeMenu() {
  const { state } = useSheet();
  const commands = useSheetCommands();
  const [query, setQuery] = useState("");
  const [askCompany, setAskCompany] = useState(false);
  const { id: popoverId, triggerRef, triggerProps, popoverProps, close } = useAnchoredPopover({
    width: WIDTH,
    align: "end",
    focusSelector: "input",
    onClose: () => setQuery(""),
  });
  const hasCompany = state.properties.some((property) => property.type === "company");

  const search = normalize(query.trim());
  const types = PROPERTY_TYPES.filter(
    (type) => !(type === "company" && hasCompany) && normalize(PROPERTY_TYPE_LABELS[type]).includes(search),
  );
  const company = types.includes("company");
  const others = types.filter((type) => type !== "company");
  // Atalho: uma Caixa de seleção já chamada "Concluído".
  const done = normalize(DONE_LABEL).includes(search);

  function choose(type: PropertyType) {
    if (type === "company") {
      close(false);
      return setAskCompany(true);
    }
    close();
    void commands.addProperty(PROPERTY_TYPE_LABELS[type], type);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const inInput = event.target instanceof HTMLInputElement;
    if (inInput && (event.key === "Home" || event.key === "End")) return;
    if (inInput && event.key === "Enter" && types[0]) {
      event.preventDefault();
      return choose(types[0]);
    }
    onRovingKeyDown(event);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        {...triggerProps}
        aria-haspopup="dialog"
        aria-label="Adicionar propriedade"
        title="Adicionar propriedade"
        className="grid size-8 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-ring"
      >
        <Plus aria-hidden className="size-4" />
      </button>
      <div {...popoverProps} role="dialog" aria-labelledby={`${popoverId}-title`} onKeyDown={onKeyDown}>
        <p id={`${popoverId}-title`} className="px-2 pt-1 pb-2 text-xs font-semibold text-muted">
          Selecionar tipo
        </p>
        <div className="relative mb-1 px-1">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Buscar tipo de propriedade"
            placeholder="Buscar tipo…"
            className="h-8 w-full rounded-md border border-border bg-surface-2 pr-2 pl-8 text-sm text-fg placeholder:text-muted/70 focus-visible:border-ring focus-visible:outline-none"
          />
        </div>
        {company ? (
          <button
            type="button"
            data-roving
            onClick={() => choose("company")}
            className={cn(itemClass, "mb-1 bg-primary/10 ring-1 ring-primary/30")}
          >
            <Building2 aria-hidden className="size-4 shrink-0 text-ring" />
            <span className="flex flex-col">
              <span className="font-medium">{PROPERTY_TYPE_LABELS.company}</span>
              <span className="text-xs text-muted">Empresas cadastradas no CRONOS</span>
            </span>
          </button>
        ) : null}
        {done ? (
          <button
            type="button"
            data-roving
            onClick={() => {
              close();
              void commands.addProperty(DONE_LABEL, "checkbox");
            }}
            className={cn(itemClass, "mb-1")}
          >
            <CircleCheck aria-hidden className="size-4 shrink-0 text-success" />
            <span className="flex flex-col">
              <span className="font-medium">{DONE_LABEL}</span>
              <span className="text-xs text-muted">Quadradinho para marcar a linha como concluída</span>
            </span>
          </button>
        ) : null}
        <ul className="grid grid-cols-2 gap-0.5" aria-label="Tipos">
          {others.map((type) => {
            const Icon = PROPERTY_TYPE_ICONS[type];
            return (
              <li key={type}>
                <button type="button" data-roving onClick={() => choose(type)} className={itemClass}>
                  <Icon aria-hidden className="size-4 shrink-0 text-muted" />
                  <span className="truncate">{PROPERTY_TYPE_LABELS[type]}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {types.length === 0 && !done ? (
          <p role="status" className="px-2 py-3 text-sm text-muted">
            Nenhum tipo encontrado.
          </p>
        ) : null}
      </div>
      {askCompany ? (
        <CompanySyncDialog
          onClose={() => {
            setAskCompany(false);
            requestAnimationFrame(() => triggerRef.current?.focus());
          }}
          onChoose={(auto) => commands.addProperty(PROPERTY_TYPE_LABELS.company, "company", auto, false)}
        />
      ) : null}
    </>
  );
}
