"use client";

import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";

/** Erro inesperado numa página logada. Mostra só uma mensagem amigável e o código de referência. */
export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  const digest =
    error instanceof Error && "digest" in error && typeof error.digest === "string" ? error.digest : null;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-danger/15 text-danger">
        <TriangleAlert aria-hidden className="size-6" />
      </span>
      <div>
        <h1 className="text-lg font-semibold text-fg">Algo deu errado</h1>
        <p className="mt-1 text-sm text-muted">
          Não foi possível carregar esta página. Tente de novo; se continuar, avise o administrador.
        </p>
        {digest ? <p className="mt-2 font-mono text-xs text-muted">Código: {digest}</p> : null}
      </div>
      <button
        type="button"
        onClick={() => retry()}
        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:bg-primary-hover"
      >
        <RotateCcw aria-hidden className="size-4" />
        Tentar novamente
      </button>
    </div>
  );
}
