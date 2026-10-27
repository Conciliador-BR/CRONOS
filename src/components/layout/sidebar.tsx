"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { getMainNav, isActivePath, type AppRole } from "@/lib/nav";
import { useShell } from "./shell-context";
import { focusById, focusOnMount, trapTabKey, useEscapeKey } from "./drawer-a11y";
import { cn } from "@/lib/utils";

export const MOBILE_MENU_ID = "app-mobile-menu";
export const MOBILE_MENU_BUTTON_ID = "app-mobile-menu-button";

/** Menu lateral: fixo e recolhível no desktop, gaveta (off-canvas) no celular. */
export function Sidebar({ role }: { role: AppRole }) {
  return (
    <>
      <DesktopSidebar role={role} />
      <MobileSidebar role={role} />
    </>
  );
}

function Brand({ compact, onNavigate }: { compact: boolean; onNavigate?: () => void }) {
  return (
    <Link
      href="/inicio"
      onClick={onNavigate}
      className="flex items-center gap-2 rounded-md px-2 py-1 font-semibold tracking-wide text-fg"
      aria-label="CRONOS, ir para o início"
    >
      <span
        aria-hidden
        className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-sm font-bold text-primary-fg"
      >
        C
      </span>
      {compact ? null : <span>CRONOS</span>}
    </Link>
  );
}

function NavList({
  role,
  compact,
  onNavigate,
}: {
  role: AppRole;
  compact: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <ul className="flex flex-col gap-1">
      {getMainNav(role).map(({ href, label, icon: Icon }) => {
        const active = isActivePath(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              title={compact ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/15 font-medium text-fg shadow-[inset_3px_0_0_var(--primary)]"
                  : "text-muted hover:bg-surface-2 hover:text-fg",
                compact && "justify-center px-0",
              )}
            >
              <Icon aria-hidden className={cn("size-5 shrink-0", active && "text-accent")} />
              {compact ? <span className="sr-only">{label}</span> : <span>{label}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function DesktopSidebar({ role }: { role: AppRole }) {
  const {
    state: { collapsed },
    actions: { toggleCollapsed },
  } = useShell();
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 lg:flex",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className={cn("flex h-14 items-center border-b border-border px-3", collapsed && "justify-center px-0")}>
        <Brand compact={collapsed} />
      </div>
      <nav aria-label="Menu principal" className="flex-1 overflow-y-auto p-2">
        <NavList role={role} compact={collapsed} />
      </nav>
      <div className="border-t border-border p-2">
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-fg",
            collapsed && "justify-center px-0",
          )}
        >
          <ToggleIcon aria-hidden className="size-5" />
          {collapsed ? null : <span>Recolher</span>}
        </button>
      </div>
    </aside>
  );
}

function MobileSidebar({ role }: { role: AppRole }) {
  const {
    state: { mobileOpen },
    actions: { closeMobile },
  } = useShell();

  function dismiss() {
    closeMobile();
    focusById(MOBILE_MENU_BUTTON_ID);
  }

  useEscapeKey(mobileOpen, dismiss);

  if (!mobileOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Fechar menu"
        tabIndex={-1}
        onClick={dismiss}
        className="absolute inset-0 bg-black/60"
      />
      <div
        id={MOBILE_MENU_ID}
        role="dialog"
        aria-modal="true"
        aria-label="Menu principal"
        onKeyDown={trapTabKey}
        className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface shadow-xl"
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-3">
          <Brand compact={false} onNavigate={closeMobile} />
          <button
            type="button"
            ref={focusOnMount}
            onClick={dismiss}
            aria-label="Fechar menu"
            className="grid size-9 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>
        <nav aria-label="Menu principal" className="flex-1 overflow-y-auto p-2">
          <NavList role={role} compact={false} onNavigate={closeMobile} />
        </nav>
      </div>
    </div>
  );
}
