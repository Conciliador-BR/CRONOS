"use client";

import { useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useSheet } from "./sheet-context";
import { useBlockEscape } from "./use-block-escape";
import { useSheetCommands } from "./use-sheet-commands";

/** Id do botão "Nova linha" do topo: recebe o foco depois de excluir (a linha/coluna some). */
export const STABLE_FOCUS_ID = "report-new-row";

/**
 * Confirmação de excluir linha ou coluna. Fica no nível da tela (sempre montada), porque a
 * exclusão otimista tira a linha/coluna — e o botão que abriu — da tabela.
 */
export function DeleteDialog() {
  const { ui, actions } = useSheet();
  const commands = useSheetCommands();
  const target = ui.pendingDelete;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Fechado pelo X durante a exclusão: o erro, se houver, vai para o aviso geral.
  const detached = useRef(false);
  const isRow = target?.kind === "row";
  useBlockEscape(pending);

  function close() {
    if (pending) detached.current = true;
    setError(null);
    actions.askDelete(null);
  }

  async function remove() {
    if (!target || pending) return;
    detached.current = false;
    setPending(true);
    setError(null);
    const message =
      target.kind === "row" ? await commands.deleteRow(target.id, false) : await commands.deleteProperty(target.id, false);
    setPending(false);
    if (detached.current) {
      detached.current = false;
      if (message) actions.reportError(message);
      return;
    }
    if (message) return setError(message);
    actions.askDelete(null);
    requestAnimationFrame(() => document.getElementById(STABLE_FOCUS_ID)?.focus());
  }

  return (
    <Modal
      open={target !== null}
      onClose={close}
      size="sm"
      closeOnBackdrop={!pending}
      title={isRow ? "Excluir esta linha?" : `Excluir a coluna “${target?.label ?? ""}”?`}
      description={
        isRow
          ? `A linha “${target?.label ?? ""}” e todos os seus valores serão apagados. Isso não pode ser desfeito.`
          : "Os valores desta coluna em todas as linhas serão apagados. Isso não pode ser desfeito."
      }
      footer={
        <>
          <Button variant="secondary" disabled={pending} onClick={close}>
            Cancelar
          </Button>
          <Button variant="danger" loading={pending} onClick={() => void remove()}>
            {isRow ? "Excluir linha" : "Excluir coluna"}
          </Button>
        </>
      }
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}
    </Modal>
  );
}
