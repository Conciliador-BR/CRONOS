"use client";

import { ImagePlus } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CARD_IMAGE_MIME_TYPES, checkCardImage } from "../../shared/files";
import { deleteCardAttachment, listCardAttachments, setCardCover, uploadCardAttachment } from "../attachment-actions";
import { patchCard } from "../board-state";
import type { CardAttachment } from "../types";
import { useBoard } from "./board-context";
import { CardPhotoViewer } from "./card-photo-viewer";
import { SectionTitle } from "./section-title";

const OFFLINE = "sem conexão com o servidor.";

/** Fotos do cartão: envio múltiplo, miniaturas, visualização grande, capa e exclusão. */
export function CardPhotos({ cardId }: { cardId: string }) {
  const { state, meta, actions } = useBoard();
  const card = state.cards[cardId];
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<CardAttachment[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const ref = { cardId, boardId: meta.boardId };

  type Loaded = { photos: CardAttachment[] | null; error: string | null };
  const fetchPhotos = (): Promise<Loaded> =>
    listCardAttachments(ref).then(
      (result) => (result.ok ? { photos: result.attachments, error: null } : { photos: null, error: result.error }),
      () => ({ photos: null, error: "Não foi possível carregar as fotos." }),
    );

  function apply(loaded: Loaded) {
    if (loaded.photos) setPhotos(loaded.photos);
    setLoadError(loaded.error);
  }

  async function reload() {
    apply(await fetchPhotos());
  }

  useEffect(() => {
    let alive = true;
    void fetchPhotos().then((loaded) => alive && apply(loaded));
    return () => {
      alive = false;
    };
    // Carrega uma vez por cartão (o componente recebe key={card.id}).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!card) return null;
  const viewing = photos?.find((photo) => photo.id === viewingId) ?? null;

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (files.length === 0) return;
    const failed: string[] = [];
    setErrors([]);
    for (const [index, file] of files.entries()) {
      setProgress({ done: index, total: files.length });
      const problem = checkCardImage(file);
      if (problem) {
        failed.push(`${file.name}: ${problem}`);
        continue;
      }
      const form = new FormData();
      form.set("cardId", cardId);
      form.set("boardId", meta.boardId);
      form.set("file", file);
      try {
        const result = await uploadCardAttachment(form);
        if (!result.ok) failed.push(`${file.name}: ${result.error}`);
      } catch {
        failed.push(`${file.name}: ${OFFLINE}`);
      }
    }
    setProgress(null);
    setErrors(failed);
    await reload();
  }

  function setCover(photo: CardAttachment | null) {
    void actions.mutate(
      (s) => patchCard(s, cardId, { coverAttachmentId: photo?.id ?? null, coverUrl: photo?.url ?? null }),
      () => setCardCover({ ...ref, attachmentId: photo?.id ?? null }),
    );
  }

  async function remove(photo: CardAttachment) {
    const ok = await actions.mutate(
      (s) =>
        patchCard(s, cardId, {
          attachmentCount: Math.max(0, (s.cards[cardId]?.attachmentCount ?? 1) - 1),
          ...(s.cards[cardId]?.coverAttachmentId === photo.id ? { coverAttachmentId: null, coverUrl: null } : {}),
        }),
      () => deleteCardAttachment({ ...ref, id: photo.id }),
    );
    if (ok) setPhotos((current) => current?.filter((item) => item.id !== photo.id) ?? null);
    return ok;
  }

  return (
    <section aria-labelledby="card-photos-title">
      <div className="flex items-center justify-between gap-2">
        <SectionTitle id="card-photos-title">Fotos</SectionTitle>
        <Button variant="secondary" size="sm" className="mb-2" loading={Boolean(progress)} onClick={() => inputRef.current?.click()}>
          {progress ? null : <ImagePlus aria-hidden />}
          Adicionar fotos
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={CARD_IMAGE_MIME_TYPES.join(",")}
          onChange={upload}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        />
      </div>
      <p className="text-xs text-muted">PNG, JPG ou WebP, até 10 MB cada.</p>
      <p role="status" className="text-xs text-muted">
        {progress ? `Enviando ${progress.done + 1} de ${progress.total}…` : ""}
      </p>
      {errors.length > 0 ? (
        <ul role="alert" className="mt-1 flex flex-col gap-0.5 text-xs font-medium text-danger">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : null}
      {loadError ? <p className="mt-1 text-xs font-medium text-danger">{loadError}</p> : null}
      {photos === null && !loadError ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-muted">
          <Spinner /> Carregando fotos…
        </p>
      ) : null}
      {photos && photos.length > 0 ? (
        <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4" aria-label="Fotos do cartão">
          {photos.map((photo) => {
            const isCover = card.coverAttachmentId === photo.id;
            return (
              <li key={photo.id} className="relative">
                <button
                  type="button"
                  onClick={() => setViewingId(photo.id)}
                  aria-label={`Ver ${photo.fileName}${isCover ? " (capa)" : ""}`}
                  className="block aspect-[4/3] w-full overflow-hidden rounded-md bg-surface-3 ring-1 ring-border hover:ring-primary/60"
                >
                  {photo.url ? (
                    // URL assinada do Storage (expira em 1 h).
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo.url} alt="" className="size-full object-cover" loading="lazy" decoding="async" />
                  ) : null}
                </button>
                {isCover ? (
                  <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-bg/85 px-1.5 py-0.5 text-[10px] font-semibold text-fg">
                    Capa
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      <CardPhotoViewer
        key={viewingId ?? "none"}
        photo={viewing}
        isCover={Boolean(viewing && card.coverAttachmentId === viewing.id)}
        onClose={() => setViewingId(null)}
        onCover={setCover}
        onDelete={remove}
      />
    </section>
  );
}
