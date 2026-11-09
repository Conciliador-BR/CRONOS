"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ToggleEvent } from "react";

/** Rolagem logo depois de abrir costuma ser causada pelo próprio foco: ignorada. */
const OPEN_GRACE_MS = 150;

/**
 * Popover (Popover API) preso a um botão: fica na camada superior (não é cortado pela rolagem
 * da tabela) e fecha com Esc ou clique fora. Ao rolar ou redimensionar, acompanha o botão;
 * fecha só se o botão sair da tela. Mesmo padrão de `card-quick-menu.tsx`, generalizado.
 */
export function useAnchoredPopover<T extends HTMLElement = HTMLButtonElement>({
  width,
  align = "start",
  focusSelector = ["button", "input"],
  onClose,
}: {
  width: number;
  align?: "start" | "end";
  /** Seletores tentados em ordem para o foco inicial (ex.: a opção selecionada, depois a primeira). */
  focusSelector?: string | string[];
  /** Chamado quando o popover fecha (Esc, clique fora, close()). */
  onClose?: () => void;
}) {
  const id = useId();
  const triggerRef = useRef<T>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const openedAt = useRef(0);
  const [open, setOpen] = useState(false);

  function place(popover: HTMLElement) {
    const trigger = triggerRef.current;
    if (!trigger) return false;
    const rect = trigger.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return false;
    const actualWidth = Math.min(width, window.innerWidth - 16);
    const preferred = align === "end" ? rect.right - actualWidth : rect.left;
    popover.style.left = `${Math.max(8, Math.min(preferred, window.innerWidth - actualWidth - 8))}px`;
    popover.style.top = `${rect.bottom + 4}px`;
    const height = popover.getBoundingClientRect().height;
    if (height && rect.bottom + 4 + height > window.innerHeight - 8) {
      popover.style.top = `${Math.max(8, rect.top - height - 4)}px`;
    }
    return true;
  }

  useEffect(() => {
    if (!open) return;
    let lastWidth = window.innerWidth;
    const follow = (event: Event) => {
      const popover = popoverRef.current;
      if (!popover) return;
      // Rolar dentro do próprio popover (lista longa) não mexe nele.
      if (event.target instanceof Node && popover.contains(event.target)) return;
      if (event.type === "scroll" && performance.now() - openedAt.current < OPEN_GRACE_MS) return;
      if (event.type === "resize") {
        // Só a altura mudou (teclado virtual do celular): mantém.
        if (window.innerWidth === lastWidth) return;
        lastWidth = window.innerWidth;
      }
      if (!place(popover)) popover.hidePopover();
    };
    window.addEventListener("scroll", follow, { capture: true, passive: true });
    window.addEventListener("resize", follow);
    return () => {
      window.removeEventListener("scroll", follow, { capture: true });
      window.removeEventListener("resize", follow);
    };
    // place lê só refs e props estáveis durante a abertura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function onBeforeToggle(event: ToggleEvent<HTMLDivElement>) {
    if (event.newState === "open") place(event.currentTarget);
  }

  function onToggle(event: ToggleEvent<HTMLDivElement>) {
    const isOpen = event.newState === "open";
    setOpen(isOpen);
    if (!isOpen) return onClose?.();
    const popover = event.currentTarget;
    openedAt.current = performance.now();
    place(popover);
    const selectors = Array.isArray(focusSelector) ? focusSelector : [focusSelector];
    for (const selector of selectors) {
      const target = popover.querySelector<HTMLElement>(selector);
      if (target) {
        target.focus({ preventScroll: true });
        break;
      }
    }
  }

  function close(returnFocus = true) {
    popoverRef.current?.hidePopover();
    if (returnFocus) triggerRef.current?.focus();
  }

  return {
    id,
    open,
    triggerRef,
    close,
    triggerProps: { popoverTarget: id, "aria-expanded": open },
    popoverProps: {
      ref: popoverRef,
      id,
      popover: "auto" as const,
      onBeforeToggle,
      onToggle,
      style: { width, maxWidth: "calc(100vw - 1rem)" },
      className:
        "fixed inset-auto m-0 max-h-[min(28rem,calc(100dvh-1rem))] overflow-y-auto overscroll-contain rounded-lg border border-border bg-surface p-1 text-fg shadow-xl shadow-black/50",
    },
  };
}

const ROVING = '[role="menuitem"], [role="menuitemcheckbox"], [role="option"], [role="switch"], [data-roving]';

/** Setas, Home e End movem o foco entre os itens do popover. */
export function onRovingKeyDown(event: KeyboardEvent<HTMLElement>, selector = ROVING) {
  const items = [...event.currentTarget.querySelectorAll<HTMLElement>(selector)];
  if (items.length === 0) return;
  const index = items.indexOf(document.activeElement as HTMLElement);
  const go = (next: number) => {
    event.preventDefault();
    items[(next + items.length) % items.length]?.focus();
  };
  if (event.key === "ArrowDown") go(index + 1);
  else if (event.key === "ArrowUp") go(index < 0 ? items.length - 1 : index - 1);
  else if (event.key === "Home") go(0);
  else if (event.key === "End") go(items.length - 1);
}

export const menuItemClass =
  "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-fg hover:bg-surface-3 focus-visible:bg-surface-3 focus-visible:outline-none";

/** Guarda o elemento focado ao abrir um modal montado condicionalmente e devolve o foco ao fechar. */
export function useReturnFocus() {
  const opener = useRef<HTMLElement | null>(null);
  return {
    capture() {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    },
    restore(fallback?: HTMLElement | null) {
      const target = opener.current?.isConnected ? opener.current : fallback;
      opener.current = null;
      // Depois do desmonte do modal.
      requestAnimationFrame(() => target?.focus());
    },
  };
}
