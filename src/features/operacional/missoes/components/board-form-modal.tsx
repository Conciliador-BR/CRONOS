"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { BOARD_COLORS } from "../../shared/colors";
import { ColorPicker } from "../../shared/color-picker";
import { removeBoardBackground, setBoardBackground } from "../background-actions";
import { boardBackdrop } from "../backgrounds";
import { createBoard, deleteBoard, updateBoard } from "../board-actions";
import type { BoardInfo } from "../types";
import { BackgroundPicker } from "./background-picker";
import { useStableImageUrl } from "./use-stable-image";

/** Criar ou editar quadro (nome, cor de fundo, imagem de fundo) e excluir. */
export function BoardFormModal({ open, onClose, board }: { open: boolean; onClose: () => void; board?: BoardInfo }) {
  const router = useRouter();
  const [name, setName] = useState(board?.name ?? "");
  const [background, setBackground] = useState(board?.background ?? BOARD_COLORS[1].value);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"save" | "delete" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const imageUrl = useStableImageUrl(board?.image ?? null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending("save");
    const result = board ? await updateBoard({ id: board.id, name, background }) : await createBoard({ name, background });
    setPending(null);
    if (!result.ok) return setError(result.error);
    setError(null);
    onClose();
    if (!board && "id" in result) router.push(`/operacional/missoes/${result.id}`);
  }

  async function remove() {
    if (!board) return;
    setPending("delete");
    const result = await deleteBoard(board.id);
    setPending(null);
    if (!result.ok) return setError(result.error);
    onClose();
    router.push("/operacional/missoes");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeOnBackdrop={false}
      title={board ? "Configurar quadro" : "Criar quadro"}
      footer={
        <>
          {board && !confirmDelete ? (
            <Button variant="ghost" className="mr-auto hover:text-danger" onClick={() => setConfirmDelete(true)}>
              Excluir quadro
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="board-form" loading={pending === "save"}>
            {board ? "Salvar" : "Criar quadro"}
          </Button>
        </>
      }
    >
      <form id="board-form" onSubmit={submit} className="flex flex-col gap-4">
        <div
          aria-hidden
          className="flex h-24 items-start gap-2 rounded-lg p-3"
          style={{ background: boardBackdrop(background, imageUrl) }}
        >
          <span className="h-14 w-16 rounded bg-white/25" />
          <span className="h-10 w-16 rounded bg-white/25" />
          <span className="h-16 w-16 rounded bg-white/25" />
        </div>
        <Field id="board-name" label="Título do quadro" required>
          <Input autoFocus maxLength={120} value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <ColorPicker name="board-color" label="Cor de fundo" colors={BOARD_COLORS} value={background} onChange={setBackground} size="lg" />
        {board ? (
          <BackgroundPicker
            label="Imagem de fundo"
            hasImage={Boolean(board.image)}
            onUpload={(file) => {
              const form = new FormData();
              form.set("file", file);
              return setBoardBackground(board.id, form);
            }}
            onRemove={() => removeBoardBackground(board.id)}
          />
        ) : null}
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {confirmDelete ? (
          <Alert tone="warning" title="Excluir este quadro?">
            <span>Todas as listas, cartões e etiquetas serão excluídos. Isso não pode ser desfeito. </span>
            <span className="mt-2 flex gap-2">
              <Button variant="danger" size="sm" loading={pending === "delete"} onClick={remove}>
                Excluir definitivamente
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                Manter
              </Button>
            </span>
          </Alert>
        ) : null}
      </form>
    </Modal>
  );
}
