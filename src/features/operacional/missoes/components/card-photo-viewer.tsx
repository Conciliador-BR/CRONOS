"use client";

import { ExternalLink, ImageOff, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Modal } from "@/components/ui/modal";
import { formatBytes } from "../../shared/files";
import type { CardAttachment } from "../types";

/** Foto em tamanho grande, com capa e exclusão (confirmada). */
export function CardPhotoViewer({
  photo,
  isCover,
  onClose,
  onCover,
  onDelete,
}: {
  photo: CardAttachment | null;
  isCover: boolean;
  onClose: () => void;
  onCover: (photo: CardAttachment | null) => void;
  onDelete: (photo: CardAttachment) => Promise<boolean>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    if (!photo) return;
    setDeleting(true);
    const ok = await onDelete(photo);
    setDeleting(false);
    setConfirming(false);
    if (ok) onClose();
  }

  return (
    <Modal
      open={Boolean(photo)}
      onClose={() => {
        setConfirming(false);
        onClose();
      }}
      size="xl"
      title={photo?.fileName ?? "Foto"}
      description={photo ? `${formatBytes(photo.sizeBytes)}${isCover ? " · capa do cartão" : ""}` : undefined}
      footer={
        photo ? (
          confirming ? (
            <div role="group" aria-label="Confirmar exclusão" className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-fg">Excluir esta foto? Isso não pode ser desfeito.</span>
              <Button variant="danger" size="sm" loading={deleting} onClick={remove}>
                Excluir foto
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <>
              {photo.canDelete ? (
                <Button variant="ghost" size="sm" className="mr-auto hover:text-danger" onClick={() => setConfirming(true)}>
                  <Trash2 aria-hidden />
                  Excluir
                </Button>
              ) : null}
              {photo.url ? (
                <a
                  href={photo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  <ExternalLink aria-hidden />
                  Abrir original
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
              ) : null}
              <Button variant="secondary" size="sm" onClick={() => onCover(isCover ? null : photo)}>
                {isCover ? "Remover capa" : "Usar como capa"}
              </Button>
            </>
          )
        ) : null
      }
    >
      {photo?.url ? (
        // URL assinada do Storage (expira em 1 h).
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo.url} alt={photo.fileName} className="mx-auto max-h-[65dvh] w-auto max-w-full rounded-md object-contain" />
      ) : (
        <p className="flex items-center gap-2 text-sm text-muted">
          <ImageOff aria-hidden className="size-4" />
          Não foi possível carregar a imagem.
        </p>
      )}
    </Modal>
  );
}
