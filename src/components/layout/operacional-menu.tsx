"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { isActivePath, type NavLink } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { focusById, focusOnMount, trapTabKey, useEscapeKey } from "./drawer-a11y";

const BUTTON_ID = "operacional-menu-button";
const PANEL_ID = "operacional-menu";

/**
 * Botão ≡ do Operacional (canto superior esquerdo da área) e a gaveta com as subpáginas.
 * Fecha com Esc, clique fora ou ao navegar; o foco volta para o botão.
 */
export function OperacionalMenu({ title, items }: { title: string; items: readonly NavLink[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = items.find((item) => isActivePath(pathname, item.href));

  function dismiss() {
    setOpen(false);
    focusById(BUTTON_ID);
  }

  useEscapeKey(open, dismiss);

  return (
    <div className="mb-6 flex items-center gap-3">
      <button
        id={BUTTON_ID}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Abrir menu ${title}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={PANEL_ID}
        className="grid size-10 shrink-0 place-items-center rounded-md border border-border bg-surface text-fg hover:border-primary/60 hover:bg-surface-2"
      >
        <Menu aria-hidden className="size-5" />
      </button>
      <p className="min-w-0 truncate text-sm text-muted">
        <span>{title}</span>
        {current ? (
          <>
            <span aria-hidden className="mx-2">/</span>
            <span className="font-medium text-fg">{current.label}</span>
          </>
        ) : null}
      </p>

      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Fechar menu"
            tabIndex={-1}
            onClick={dismiss}
            className="absolute inset-0 bg-black/60"
          />
          <div
            id={PANEL_ID}
            role="dialog"
            aria-modal="true"
            aria-label={`Menu ${title}`}
            onKeyDown={trapTabKey}
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface shadow-xl"
          >
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <p className="font-semibold text-fg">{title}</p>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Fechar menu"
                className="grid size-9 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <nav aria-label={title} className="flex-1 overflow-y-auto p-2">
              <ul className="flex flex-col gap-1">
                {items.map(({ href, label }) => {
                  const active = current?.href === href;
                  const focusOnOpen = href === (current ?? items[0])?.href;
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => setOpen(false)}
                        ref={focusOnOpen ? focusOnMount : undefined}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "block rounded-md px-3 py-2.5 text-sm transition-colors",
                          active
                            ? "bg-primary/15 font-medium text-fg shadow-[inset_3px_0_0_var(--primary)]"
                            : "text-muted hover:bg-surface-2 hover:text-fg",
                        )}
                      >
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}
