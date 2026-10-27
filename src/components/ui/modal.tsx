"use client";

import { useId, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useModalDialog } from "./dialog-base";

const widths = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
} as const;

export type ModalProps = {
  open: boolean;
  /** Chamado em Esc, clique fora, botão X ou dialog.close(). */
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  /** Ações (ex.: Cancelar / Salvar), alinhadas à direita. */
  footer?: ReactNode;
  size?: keyof typeof widths;
  /** false impede fechar clicando no fundo (ex.: formulário com dados). */
  closeOnBackdrop?: boolean;
  className?: string;
  children?: ReactNode;
};

/** Diálogo modal acessível sobre <dialog> nativo. */
export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  size = "md",
  closeOnBackdrop = true,
  className,
  children,
}: ModalProps) {
  const { ref, onBackdropClick } = useModalDialog(open, onClose);
  const titleId = useId();
  const descId = useId();

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClick={closeOnBackdrop ? onBackdropClick : undefined}
      className={cn(
        "m-auto w-[calc(100%-2rem)] overflow-visible bg-transparent p-0 text-fg backdrop:animate-fade-in open:animate-pop-in",
        widths[size],
      )}
    >
      {open ? (
        <div
          className={cn(
            "flex max-h-[calc(100dvh-2rem)] flex-col rounded-xl border border-border bg-surface shadow-2xl shadow-black/60",
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

export function CloseButton({ onClick, label = "Fechar" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="-mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-fg"
    >
      <X aria-hidden className="size-4" />
    </button>
  );
}
