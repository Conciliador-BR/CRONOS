"use client";

import { Menu } from "lucide-react";
import { useShell } from "./shell-context";
import { MOBILE_MENU_BUTTON_ID, MOBILE_MENU_ID } from "./sidebar";

/** Abre o menu lateral no celular (escondido a partir de `lg`). */
export function MobileMenuButton() {
  const {
    state: { mobileOpen },
    actions: { openMobile },
  } = useShell();

  return (
    <button
      id={MOBILE_MENU_BUTTON_ID}
      type="button"
      onClick={openMobile}
      aria-label="Abrir menu"
      aria-expanded={mobileOpen}
      aria-controls={MOBILE_MENU_ID}
      className="grid size-9 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-fg lg:hidden"
    >
      <Menu aria-hidden className="size-5" />
    </button>
  );
}
