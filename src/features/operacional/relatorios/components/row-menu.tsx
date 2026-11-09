"use client";

import { Ellipsis, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSheet } from "./sheet-context";
import { menuItemClass, onRovingKeyDown, useAnchoredPopover } from "./use-anchored-popover";

/** Menu "…" da linha: "Excluir linha" abre a confirmação do nível da tela (`DeleteDialog`). */
export function RowMenu({ rowId, label }: { rowId: string; label: string }) {
  const { actions } = useSheet();
  const { triggerRef, triggerProps, popoverProps, close } = useAnchoredPopover({
    width: 200,
    align: "end",
    focusSelector: '[role="menuitem"]',
  });

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        {...triggerProps}
        aria-haspopup="menu"
        aria-label={`Ações da linha ${label}`}
        className="grid size-8 place-items-center rounded-md text-muted opacity-60 group-hover/row:opacity-100 hover:bg-surface-2 hover:text-fg focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-ring aria-expanded:opacity-100"
      >
        <Ellipsis aria-hidden className="size-4" />
      </button>
      <div {...popoverProps} role="menu" aria-label={`Linha ${label}`} onKeyDown={(event) => onRovingKeyDown(event)}>
        <button
          type="button"
          role="menuitem"
          className={cn(menuItemClass, "text-danger")}
          onClick={() => {
            close();
            actions.askDelete({ kind: "row", id: rowId, label });
          }}
        >
          <Trash2 aria-hidden className="size-4" />
          Excluir linha
        </button>
      </div>
    </>
  );
}
