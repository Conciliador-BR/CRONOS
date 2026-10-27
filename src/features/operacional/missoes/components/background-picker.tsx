"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useId, useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { CARD_IMAGE_MIME_TYPES, checkCardImage } from "../../shared/files";
import type { ActionResult } from "../../shared/result";

type Pending = "upload" | "remove" | null;

const OFFLINE = "Sem conexão com o servidor. Tente novamente.";
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Escolher / remover uma imagem de fundo. Salva na hora (sem botão "Salvar"):
 * confere tipo e tamanho no navegador, o servidor confere de novo. Status e erro ficam ao lado.
 */
export function BackgroundPicker({
  label,
  hasImage,
  onUpload,
  onRemove,
}: {
  label: string;
  hasImage: boolean;
  onUpload: (file: File) => Promise<ActionResult>;
  onRemove: () => Promise<ActionResult>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const hintId = useId();
  const errorId = useId();
  const [pending, setPending] = useState<Pending>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function run(kind: Exclude<Pending, null>, call: () => Promise<ActionResult>, success: string) {
    setPending(kind);
    setError(null);
    setDone(null);
    try {
      const result = await call();
      if (result.ok) setDone(success);
      else setError(result.error);
    } catch {
      setError(OFFLINE);
    } finally {
      setPending(null);
    }
  }

  function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const problem = checkCardImage(file);
    if (problem) {
      setDone(null);
      return setError(capitalize(problem));
    }
    void run("upload", () => onUpload(file), "Imagem salva.");
  }

  const status = pending === "upload" ? "Enviando imagem…" : pending === "remove" ? "Removendo imagem…" : done;

  return (
    <div role="group" aria-labelledby={titleId} aria-describedby={error ? `${hintId} ${errorId}` : hintId}>
      <p id={titleId} className="text-sm font-medium text-fg">
        {label}
      </p>
      <p id={hintId} className="mt-0.5 text-xs text-muted">
        PNG, JPG ou WebP, até 10 MB. Fica na última camada, atrás de tudo.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          loading={pending === "upload"}
          disabled={pending !== null}
          onClick={() => inputRef.current?.click()}
        >
          {pending === "upload" ? null : <ImagePlus aria-hidden />}
          {hasImage ? "Trocar imagem" : "Escolher imagem"}
        </Button>
        {hasImage ? (
          <Button
            variant="ghost"
            size="sm"
            className="hover:text-danger"
            loading={pending === "remove"}
            disabled={pending !== null}
            onClick={() => void run("remove", onRemove, "Imagem removida.")}
          >
            {pending === "remove" ? null : <Trash2 aria-hidden />}
            Remover
          </Button>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept={CARD_IMAGE_MIME_TYPES.join(",")}
          onChange={choose}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        />
      </div>
      <p role="status" className="mt-1 min-h-4 text-xs text-muted">
        {status ?? ""}
      </p>
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
