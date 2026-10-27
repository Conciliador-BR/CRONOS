"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type RefObject, type ToggleEvent } from "react";
import { ArrowLeft, ArrowRight, Ellipsis, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MENU_WIDTH = 216;

type Props = {
  label: string;
  /** Botão "⋯": o foco volta para ele depois de renomear. */
  buttonRef: RefObject<HTMLButtonElement | null>;
  onRename: () => void;
  /** Ausentes quando a coluna já está na ponta. */
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  /** Ausente nas colunas de fechado e perdido. */
  onDelete?: () => void;
};

/**
 * Menu "⋯" da coluna (Renomear, Mover, Excluir), só para gestores. Usa a Popover API: fica na
 * camada superior (não é cortado pela rolagem do quadro), fecha com Esc ou clique fora. Setas navegam.
 */
export function StageMenu({ label, buttonRef, onRename, onMoveLeft, onMoveRight, onDelete }: Props) {
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  // Rolar o quadro deixaria o menu solto na tela: fecha.
  useEffect(() => {
    if (!open) return;
    const close = () => menuRef.current?.hidePopover();
    window.addEventListener("scroll", close, { capture: true, passive: true });
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, { capture: true });
      window.removeEventListener("resize", close);
    };
  }, [open]);

  function onBeforeToggle(event: ToggleEvent<HTMLDivElement>) {
    const button = buttonRef.current;
    if (event.newState !== "open" || !button) return;
    const rect = button.getBoundingClientRect();
    event.currentTarget.style.top = `${rect.bottom + 4}px`;
    event.currentTarget.style.left = `${Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8))}px`;
  }

  function onToggle(event: ToggleEvent<HTMLDivElement>) {
    const isOpen = event.newState === "open";
    setOpen(isOpen);
    if (isOpen) event.currentTarget.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }

  function run(command: () => void) {
    menuRef.current?.hidePopover();
    buttonRef.current?.focus();
    command();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]')];
    const index = items.indexOf(document.activeElement as HTMLElement);
    const go = (next: number) => {
      event.preventDefault();
      items[(next + items.length) % items.length]?.focus();
    };
    if (event.key === "ArrowDown") go(index + 1);
    else if (event.key === "ArrowUp") go(index - 1);
    else if (event.key === "Home") go(0);
    else if (event.key === "End") go(items.length - 1);
    else if (event.key === "Tab") {
      event.preventDefault();
      menuRef.current?.hidePopover();
      buttonRef.current?.focus();
    }
  }

  const itemClass =
    "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-fg hover:bg-surface-3 focus-visible:bg-surface-3 focus-visible:outline-none";

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        popoverTarget={menuId}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Opções da etapa ${label}`}
        title="Opções da etapa"
        className="grid size-7 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-surface-3 hover:text-fg aria-expanded:bg-surface-3 aria-expanded:text-fg"
      >
        <Ellipsis aria-hidden className="size-4" />
      </button>
      <div
        ref={menuRef}
        id={menuId}
        popover="auto"
        role="menu"
        aria-label={`Opções da etapa ${label}`}
        onBeforeToggle={onBeforeToggle}
        onToggle={onToggle}
        onKeyDown={onKeyDown}
        style={{ width: MENU_WIDTH }}
        className="fixed inset-auto m-0 rounded-lg border border-border bg-surface p-1 text-fg shadow-xl shadow-black/50"
      >
        <button type="button" role="menuitem" className={itemClass} onClick={() => run(onRename)}>
          <Pencil aria-hidden className="size-4 text-muted" />
          Renomear
        </button>
        {onMoveLeft ? (
          <button type="button" role="menuitem" className={itemClass} onClick={() => run(onMoveLeft)}>
            <ArrowLeft aria-hidden className="size-4 text-muted" />
            Mover para a esquerda
          </button>
        ) : null}
        {onMoveRight ? (
          <button type="button" role="menuitem" className={itemClass} onClick={() => run(onMoveRight)}>
            <ArrowRight aria-hidden className="size-4 text-muted" />
            Mover para a direita
          </button>
        ) : null}
        {onDelete ? (
          <button type="button" role="menuitem" className={cn(itemClass, "text-danger")} onClick={() => run(onDelete)}>
            <Trash2 aria-hidden className="size-4" />
            Excluir etapa
          </button>
        ) : null}
      </div>
    </>
  );
}
