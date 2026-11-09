"use client";

import { ImagePlus, MoveVertical, Trash2 } from "lucide-react";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CARD_IMAGE_MIME_TYPES, checkCardImage } from "../../shared/files";
import { removeListCover, setListCover, setListCoverPosition } from "../background-actions";
import { useBoard } from "./board-context";

/** Envio e remoção da capa da lista; o input de arquivo fica escondido e é aberto por `pick()`. */
function useListCover(listId: string) {
  const { actions } = useBoard();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File | undefined) {
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    const problem = checkCardImage(file);
    if (problem) return actions.reportError(problem);
    setBusy(true);
    const data = new FormData();
    data.set("file", file);
    const result = await setListCover(listId, data).catch(() => null);
    setBusy(false);
    if (!result?.ok) return actions.reportError(result?.error ?? "Sem conexão com o servidor. Tente novamente.");
    actions.setState((s) => ({ ...s, lists: { ...s.lists, [listId]: { ...s.lists[listId], cover: result.cover } } }));
  }

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept={CARD_IMAGE_MIME_TYPES.join(",")}
      className="sr-only"
      tabIndex={-1}
      aria-hidden
      onChange={(event) => void upload(event.target.files?.[0])}
    />
  );

  return {
    busy,
    input,
    pick: () => inputRef.current?.click(),
    remove: () =>
      actions.mutate(
        (s) => ({ ...s, lists: { ...s.lists, [listId]: { ...s.lists[listId], cover: null } } }),
        () => removeListCover(listId),
      ),
  };
}

const clampPosition = (value: number) => Math.min(100, Math.max(0, value));

/**
 * Enquadramento vertical da capa: arrastar a foto (ou setas do teclado) e salvar.
 * `draft` é a posição em edição; null fora do modo de ajuste.
 */
function useCoverPosition(listId: string, saved: number) {
  const { actions } = useBoard();
  const [draft, setDraft] = useState<number | null>(null);
  const drag = useRef<{ y: number; start: number; overflow: number } | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  async function save() {
    if (draft === null) return;
    const position = Math.round(draft);
    setDraft(null);
    if (position === saved) return;
    await actions.mutate(
      (s) => {
        const cover = s.lists[listId]?.cover;
        return cover ? { ...s, lists: { ...s.lists, [listId]: { ...s.lists[listId], cover: { ...cover, position } } } } : s;
      },
      () => setListCoverPosition({ listId, position }),
    );
  }

  const imageHandlers = {
    onPointerDown(event: PointerEvent<HTMLImageElement>) {
      if (draft === null) return;
      event.stopPropagation();
      const img = event.currentTarget;
      // Quanto da foto sobra fora da caixa (object-fit: cover); 100% da posição percorre essa sobra.
      const shown = img.naturalWidth ? img.naturalHeight * (img.clientWidth / img.naturalWidth) : img.clientHeight;
      drag.current = { y: event.clientY, start: draft, overflow: Math.max(shown - img.clientHeight, 1) };
      img.setPointerCapture(event.pointerId);
    },
    onPointerMove(event: PointerEvent<HTMLImageElement>) {
      const current = drag.current;
      if (current) setDraft(clampPosition(current.start - ((event.clientY - current.y) * 100) / current.overflow));
    },
    onPointerUp() {
      drag.current = null;
    },
  };

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (draft === null) return;
    const step = event.shiftKey ? 10 : 2;
    if (event.key === "ArrowUp") setDraft(clampPosition(draft + step));
    else if (event.key === "ArrowDown") setDraft(clampPosition(draft - step));
    else if (event.key === "Enter") void save();
    else if (event.key === "Escape") setDraft(null);
    else return;
    event.preventDefault();
    event.stopPropagation();
  }

  function start() {
    setDraft(saved);
    // O botão some no modo de ajuste; o foco vai para a foto (setas já funcionam).
    requestAnimationFrame(() => sliderRef.current?.focus());
  }

  return { draft, sliderRef, start, cancel: () => setDraft(null), save, imageHandlers, onKeyDown };
}

/** Capa no topo da coluna, um pouco mais alta que a dos cartões; trocar, ajustar e remover aparecem no hover/foco. */
export function ListCover({ listId }: { listId: string }) {
  const { state } = useBoard();
  const list = state.lists[listId];
  const { busy, input, pick, remove } = useListCover(listId);
  const { draft, sliderRef, start, cancel, save, imageHandlers, onKeyDown } = useCoverPosition(listId, list?.cover?.position ?? 50);
  if (!list?.cover) return null;

  const adjusting = draft !== null;
  const position = draft ?? list.cover.position;
  const buttonClass =
    "grid size-8 place-items-center rounded-md bg-black/60 text-white opacity-0 backdrop-blur group-hover/cover:opacity-100 hover:bg-black/80 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-ring";
  return (
    <div className="group/cover relative -mt-2 mb-2 overflow-hidden rounded-t-xl">
      <div
        ref={sliderRef}
        role={adjusting ? "slider" : undefined}
        tabIndex={adjusting ? 0 : undefined}
        aria-label={adjusting ? `Posição da capa da lista ${list.name}` : undefined}
        aria-valuemin={adjusting ? 0 : undefined}
        aria-valuemax={adjusting ? 100 : undefined}
        aria-valuenow={adjusting ? Math.round(position) : undefined}
        aria-valuetext={adjusting ? `${Math.round(position)}% (setas sobem e descem a foto, Enter salva, Esc cancela)` : undefined}
        onKeyDown={onKeyDown}
        className="focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        {/* URL assinada do Storage (muda a cada requisição); next/image otimizaria a cada troca. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={list.cover.url}
          alt=""
          className={`block h-40 w-full bg-surface-3 object-cover ${adjusting ? "cursor-grab touch-none select-none active:cursor-grabbing" : ""}`}
          style={{ objectPosition: `50% ${position}%` }}
          decoding="async"
          draggable={false}
          {...imageHandlers}
        />
      </div>
      {busy ? (
        <span className="absolute inset-0 grid place-items-center bg-black/40">
          <Spinner />
        </span>
      ) : null}
      {adjusting ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
          <span className="text-xs text-white">Arraste a foto para enquadrar</span>
          <span className="pointer-events-auto flex gap-1">
            <Button size="sm" variant="secondary" onClick={cancel}>
              Cancelar
            </Button>
            <Button size="sm" onClick={() => void save()}>
              Salvar
            </Button>
          </span>
        </div>
      ) : null}
      <div className={`absolute top-2 right-2 flex gap-1 ${adjusting ? "hidden" : ""}`}>
        {input}
        <button type="button" onClick={pick} aria-label={`Trocar capa da lista ${list.name}`} title="Trocar capa" className={buttonClass}>
          <ImagePlus aria-hidden className="size-4" />
        </button>
        <button
          type="button"
          onClick={start}
          aria-label={`Ajustar posição da capa da lista ${list.name}`}
          title="Ajustar posição"
          className={buttonClass}
        >
          <MoveVertical aria-hidden className="size-4" />
        </button>
        <button type="button" onClick={() => void remove()} aria-label={`Remover capa da lista ${list.name}`} title="Remover capa" className={buttonClass}>
          <Trash2 aria-hidden className="size-4" />
        </button>
      </div>
    </div>
  );
}

/** Botão do cabeçalho da lista para pôr capa (só aparece enquanto ela não tem capa). */
export function AddListCoverButton({ listId, listName }: { listId: string; listName: string }) {
  const { busy, input, pick } = useListCover(listId);
  return (
    <>
      {input}
      <button
        type="button"
        onClick={pick}
        disabled={busy}
        aria-label={`Adicionar capa à lista ${listName}`}
        title="Adicionar capa"
        className="grid size-8 shrink-0 place-items-center rounded-md text-muted hover:bg-surface-3 hover:text-fg focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60"
      >
        {busy ? <Spinner /> : <ImagePlus aria-hidden className="size-4" />}
      </button>
    </>
  );
}
