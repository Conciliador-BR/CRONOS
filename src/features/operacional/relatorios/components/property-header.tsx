"use client";

import { ListChecks, Trash2 } from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import type { ReportProperty } from "../types";
import { OptionsEditor } from "./options-editor";
import { PROPERTY_TYPE_ICONS } from "./property-icons";
import { useSheet } from "./sheet-context";
import { menuItemClass, onRovingKeyDown, useAnchoredPopover } from "./use-anchored-popover";
import { useSheetCommands } from "./use-sheet-commands";

const HAS_OPTIONS = new Set(["select", "multi_select", "status"]);

/**
 * Cabeçalho de uma coluna: clique abre um painel (diálogo não modal) com o nome editável,
 * opções, sincronização de empresas e excluir. Fechar salva o nome; Esc descarta.
 */
export function PropertyHeader({ property }: { property: ReportProperty }) {
  const { state, actions } = useSheet();
  const commands = useSheetCommands();
  const [name, setName] = useState(property.name);
  const [editingOptions, setEditingOptions] = useState(false);
  const discard = useRef(false);
  const [prevName, setPrevName] = useState(property.name);
  if (property.name !== prevName) {
    setPrevName(property.name);
    setName(property.name);
  }

  const { id: popoverId, triggerRef, triggerProps, popoverProps, close } = useAnchoredPopover({
    width: 260,
    focusSelector: "input",
    onClose: () => {
      const value = name.trim();
      if (discard.current || !value) {
        discard.current = false;
        return setName(property.name);
      }
      if (value !== property.name) void commands.updateProperty(property.id, { name: value });
    },
  });
  const Icon = PROPERTY_TYPE_ICONS[property.type];
  const synced = state.sheet.autoAddCompanies;

  function onPanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") discard.current = true;
    const inInput = event.target instanceof HTMLInputElement;
    if (inInput && event.key === "Enter") {
      event.preventDefault();
      close(); // fechar salva o nome (onClose)
      return;
    }
    if (!inInput || event.key === "ArrowDown") onRovingKeyDown(event);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        {...triggerProps}
        aria-haspopup="dialog"
        title={`Opções da coluna ${property.name}`}
        className="flex h-9 w-full min-w-0 items-center gap-1.5 pr-7 pl-2 text-left text-xs font-medium text-muted hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        <Icon aria-hidden className="size-3.5 shrink-0" />
        <span className="truncate">{property.name}</span>
      </button>
      <div {...popoverProps} role="dialog" aria-label={`Coluna ${property.name}`} onKeyDown={onPanelKeyDown}>
        <div className="p-1.5">
          <label htmlFor={`${popoverId}-name`} className="mb-1 block text-xs text-muted">
            Nome da coluna
          </label>
          <input
            id={`${popoverId}-name`}
            value={name}
            maxLength={80}
            onChange={(event) => setName(event.target.value)}
            className="h-8 w-full rounded-md border border-border bg-surface-2 px-2 text-sm text-fg focus-visible:border-ring focus-visible:outline-none"
          />
        </div>
        {HAS_OPTIONS.has(property.type) ? (
          <button
            type="button"
            data-roving
            className={menuItemClass}
            onClick={() => {
              close(false);
              setEditingOptions(true);
            }}
          >
            <ListChecks aria-hidden className="size-4 text-muted" />
            Editar opções
          </button>
        ) : null}
        {property.type === "company" ? (
          <button
            type="button"
            role="switch"
            aria-checked={synced}
            className={menuItemClass}
            onClick={() => void commands.setCompanySync(!synced)}
          >
            <span className="flex-1">Adicionar empresas automaticamente</span>
            <span
              aria-hidden
              className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", synced ? "bg-primary" : "bg-surface-3")}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-4 rounded-full bg-white transition-[left] motion-reduce:transition-none",
                  synced ? "left-[18px]" : "left-0.5",
                )}
              />
            </span>
          </button>
        ) : null}
        <button
          type="button"
          data-roving
          className={cn(menuItemClass, "text-danger")}
          onClick={() => {
            close();
            actions.askDelete({ kind: "property", id: property.id, label: property.name });
          }}
        >
          <Trash2 aria-hidden className="size-4" />
          Excluir coluna
        </button>
      </div>
      {editingOptions ? (
        <OptionsEditor
          property={property}
          onClose={() => {
            setEditingOptions(false);
            requestAnimationFrame(() => triggerRef.current?.focus());
          }}
        />
      ) : null}
    </>
  );
}
