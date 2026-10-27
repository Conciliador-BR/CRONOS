"use client";

import { createContext, use, useState, type ReactNode } from "react";

type ShellContextValue = {
  state: { collapsed: boolean; mobileOpen: boolean };
  actions: {
    toggleCollapsed: () => void;
    openMobile: () => void;
    closeMobile: () => void;
  };
};

const ShellContext = createContext<ShellContextValue | null>(null);

/** Único lugar que sabe como o estado do shell (menu recolhido / gaveta no celular) é guardado. */
export function ShellProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const value: ShellContextValue = {
    state: { collapsed, mobileOpen },
    actions: {
      toggleCollapsed: () => setCollapsed((c) => !c),
      openMobile: () => setMobileOpen(true),
      closeMobile: () => setMobileOpen(false),
    },
  };

  return <ShellContext value={value}>{children}</ShellContext>;
}

export function useShell() {
  const ctx = use(ShellContext);
  if (!ctx) throw new Error("useShell precisa estar dentro de <ShellProvider>");
  return ctx;
}
