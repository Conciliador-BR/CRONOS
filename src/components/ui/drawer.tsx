"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useModalDialog } from "./dialog-base";
import { CloseButton } from "./modal";

const widths = {
  sm: "sm:max-w-xs",
  md: "sm:max-w-md",
  lg: "sm:max-w-xl",
} as const;

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  /** Lado de onde a gaveta entra. Menu ≡ do Operacional: "left"; painéis de detalhe: "right". */
  side?: "left" | "right";
  size?: keyof typeof widths;
  footer?: ReactNode;
  className?: string;
  children?: ReactNode;
};

/** Painel lateral modal (side sheet) sobre <dialog> nativo. Ocupa a tela toda no celular. */
export function Drawer({
  open,
  onClose,
  title,
  description,
  side = "right",
  size = "md",
  footer,
  className,
  children,
}: DrawerProps) {
  const { ref, onBackdropClick } = useModalDialog(open, onClose);
  const titleId = useId();
  const descId = useId();

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClick={onBackdropClick}
      className={cn(
        "fixed inset-y-0 m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 text-fg backdrop:animate-fade-in",
        side === "left" ? "right-auto left-0 open:animate-slide-in-left" : "right-0 left-auto open:animate-slide-in-right",
        widths[size],
      )}
    >
      {open ? (
        <div
          className={cn(
            "flex h-full flex-col bg-surface shadow-2xl shadow-black/60",
            side === "left" ? "border-r border-border" : "border-l border-border",
            className,
          )}
        >
          <header className="flex items-start gap-3 border-b border-border px-5 py-4">
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-lg font-semibold text-balance">
                {title}
              </h2>
              {description ? (
                <p id={descId} className="mt-1 text-sm text-muted text-pretty">
                  {description}
                </p>
              ) : null}
            </div>
            <CloseButton onClick={() => ref.current?.close()} />
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
          {footer ? (
            <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-3">
              {footer}
            </footer>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}
