"use client";

import { Archive, ArrowRightLeft, CircleCheck, CircleDashed, Ellipsis } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ToggleEvent } from "react";
import { cn } from "@/lib/utils";
import { useBoard } from "./board-context";
import { useCardCommands } from "./use-card-commands";

const MENU_WIDTH = 208;

/**
 * Menu "…" do cartão (Mudar de quadro, Concluir, Arquivar). Usa a Popover API: fica na camada
 * superior (não é cortado pela rolagem da lista), fecha com Esc ou clique fora. Setas navegam.
 */
export function CardQuickMenu({ cardId }: { cardId: string }) {
  const { state, actions } = useBoard();
  const commands = useCardCommands(cardId);
  const card = state.cards[cardId];
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
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

  if (!card) return null;

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
    const menu = event.currentTarget;
    if (!isOpen) return;
    const rect = menu.getBoundingClientRect();
    if (rect.bottom > window.innerHeight - 8) {
      const buttonTop = buttonRef.current?.getBoundingClientRect().top ?? window.innerHeight;
      menu.style.top = `${Math.max(8, buttonTop - rect.height - 4)}px`;
    }
    menu.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }

  function run(command: () => unknown) {
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
        aria-label={`Ações rápidas: ${card.title}`}
        onPointerDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        className={cn(
          "pointer-events-auto grid size-7 place-items-center rounded-md bg-surface-2/90 text-muted shadow-sm ring-1 ring-border transition-opacity hover:bg-surface-3 hover:text-fg motion-reduce:transition-none",
          "opacity-0 group-focus-within/card:opacity-100 group-hover/card:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100 [@media(hover:none)]:opacity-100",
        )}
      >
        <Ellipsis aria-hidden className="size-4" />
      </button>
      <div
        ref={menuRef}
        id={menuId}
        popover="auto"
        role="menu"
        aria-label={`Ações do cartão ${card.title}`}
        onBeforeToggle={onBeforeToggle}
        onToggle={onToggle}
        onKeyDown={onKeyDown}
        style={{ width: MENU_WIDTH }}
        className="pointer-events-auto fixed inset-auto m-0 rounded-lg border border-border bg-surface p-1 text-fg shadow-xl shadow-black/50"
      >
        <button type="button" role="menuitem" className={itemClass} onClick={() => run(() => actions.openCard(cardId, "move"))}>
          <ArrowRightLeft aria-hidden className="size-4 text-muted" />
          Mudar de quadro / lista
        </button>
        <button type="button" role="menuitem" className={itemClass} onClick={() => run(commands.toggleCompleted)}>
          {card.completed ? (
            <CircleDashed aria-hidden className="size-4 text-muted" />
          ) : (
            <CircleCheck aria-hidden className="size-4 text-success" />
          )}
          {card.completed ? "Reabrir (não concluída)" : "Concluir"}
        </button>
        <button type="button" role="menuitem" className={itemClass} onClick={() => run(commands.archive)}>
          <Archive aria-hidden className="size-4 text-muted" />
          Arquivar
        </button>
      </div>
    </>
  );
}
