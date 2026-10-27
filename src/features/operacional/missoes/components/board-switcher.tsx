"use client";

import { ArrowRightLeft, Check, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useId, useRef, useState, type KeyboardEvent, type ToggleEvent } from "react";
import { cn } from "@/lib/utils";
import type { BoardDestination } from "../types";

const MENU_WIDTH = 280;

/**
 * Barra flutuante no centro, embaixo do quadro (como no Trello): "Mudar de quadro" abre a lista
 * de quadros para trocar de um para outro. Popover API: fecha com Esc ou clique fora; setas navegam.
 */
export function BoardSwitcher({ currentId, boards }: { currentId: string; boards: BoardDestination[] }) {
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  function onBeforeToggle(event: ToggleEvent<HTMLDivElement>) {
    const button = buttonRef.current;
    if (event.newState !== "open" || !button) return;
    const rect = button.getBoundingClientRect();
    const menu = event.currentTarget;
    menu.style.bottom = `${window.innerHeight - rect.top + 8}px`;
    menu.style.left = `${Math.max(8, Math.min(rect.left + rect.width / 2 - MENU_WIDTH / 2, window.innerWidth - MENU_WIDTH - 8))}px`;
  }

  function onToggle(event: ToggleEvent<HTMLDivElement>) {
    const isOpen = event.newState === "open";
    setOpen(isOpen);
    if (!isOpen) return;
    const items = event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]');
    (event.currentTarget.querySelector<HTMLElement>('[aria-current="page"]') ?? items[0])?.focus();
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
    "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-fg hover:bg-surface-3 focus-visible:bg-surface-3 focus-visible:outline-none";

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center">
      <button
        ref={buttonRef}
        type="button"
        popoverTarget={menuId}
        aria-haspopup="menu"
        aria-expanded={open}
        className="pointer-events-auto inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface/95 px-4 text-sm font-medium text-fg shadow-lg shadow-black/40 backdrop-blur transition-colors hover:bg-surface-2 aria-expanded:border-primary"
      >
        <ArrowRightLeft aria-hidden className="size-4 text-accent" />
        Mudar de quadro
      </button>
      <div
        ref={menuRef}
        id={menuId}
        popover="auto"
        role="menu"
        aria-label="Quadros"
        onBeforeToggle={onBeforeToggle}
        onToggle={onToggle}
        onKeyDown={onKeyDown}
        style={{ width: MENU_WIDTH }}
        className="pointer-events-auto fixed inset-auto m-0 max-h-[60vh] overflow-y-auto rounded-lg border border-border bg-surface p-1 text-fg shadow-xl shadow-black/50"
      >
        <p className="px-2.5 pt-1.5 pb-1 text-xs font-medium tracking-wide text-muted uppercase">Seus quadros</p>
        {boards.map((board) => {
          const current = board.id === currentId;
          return (
            <Link
              key={board.id}
              href={`/operacional/missoes/${board.id}`}
              role="menuitem"
              aria-current={current ? "page" : undefined}
              onClick={() => menuRef.current?.hidePopover()}
              className={cn(itemClass, current && "bg-surface-2")}
            >
              <span aria-hidden className="size-5 shrink-0 rounded" style={{ background: board.background }} />
              <span className="min-w-0 flex-1 truncate">{board.name}</span>
              {current ? <Check aria-hidden className="size-4 text-accent" /> : null}
            </Link>
          );
        })}
        <div className="my-1 border-t border-border" />
        <Link href="/operacional/missoes" role="menuitem" onClick={() => menuRef.current?.hidePopover()} className={itemClass}>
          <LayoutGrid aria-hidden className="size-4 text-muted" />
          Ver todos os quadros
        </Link>
      </div>
    </div>
  );
}
