"use client";

import { Check } from "lucide-react";
import type { CellValue, PropertyOption, ReportProperty } from "../../types";
import { OptionPill } from "../option-pill";
import { menuItemClass, onRovingKeyDown, useAnchoredPopover } from "../use-anchored-popover";
import { cellTriggerClass } from "./cell-styles";

/** Selecionar, Status (uma opção) e Seleção múltipla (várias): pílulas + lista de opções. */
export function OptionCell({
  property,
  value,
  label,
  onCommit,
}: {
  property: ReportProperty;
  value: CellValue | null;
  label: string;
  onCommit: (value: CellValue | null) => void;
}) {
  const multiple = property.type === "multi_select";
  const { triggerRef, triggerProps, popoverProps, close } = useAnchoredPopover({ width: 240, focusSelector: ['[role="option"][aria-selected="true"]', '[role="option"]'] });
  const selected = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  const byId = new Map(property.options.map((option) => [option.id, option]));
  const chosen = selected.map((id) => byId.get(id)).filter((option): option is PropertyOption => Boolean(option));

  function pick(id: string) {
    if (!multiple) {
      close();
      if (selected[0] !== id) onCommit(id);
      return;
    }
    const next = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
    onCommit(next.length ? next : null);
  }

  function clear() {
    close();
    if (selected.length) onCommit(null);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        {...triggerProps}
        aria-haspopup="listbox"
        aria-label={`${label}: ${chosen.map((option) => option.name).join(", ") || "vazio"}`}
        className={cellTriggerClass}
      >
        <span className="flex min-w-0 flex-wrap gap-1">
          {chosen.map((option) => (
            <OptionPill key={option.id} option={option} />
          ))}
        </span>
      </button>
      <div {...popoverProps} onKeyDown={(event) => onRovingKeyDown(event)}>
        <div role="listbox" aria-label={label} aria-multiselectable={multiple || undefined}>
          {property.options.map((option) => {
            const isSelected = selected.includes(option.id);
            return (
              <div
                key={option.id}
                role="option"
                tabIndex={-1}
                aria-selected={isSelected}
                onClick={() => pick(option.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    pick(option.id);
                  }
                }}
                className={`${menuItemClass} cursor-pointer`}
              >
                <OptionPill option={option} />
                {isSelected ? <Check aria-hidden className="ml-auto size-4 text-ring" /> : null}
              </div>
            );
          })}
        </div>
        {property.options.length === 0 ? (
          <p className="px-2.5 py-2 text-sm text-muted">Sem opções. Use o menu da coluna para criar.</p>
        ) : null}
        {selected.length ? (
          <button type="button" onClick={clear} className={`${menuItemClass} mt-1 border-t border-border text-muted`}>
            Limpar
          </button>
        ) : null}
      </div>
    </>
  );
}
