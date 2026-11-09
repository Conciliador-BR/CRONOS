"use client";

import { Building2 } from "lucide-react";
import { useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useSheet } from "./sheet-context";
import { useBlockEscape } from "./use-block-escape";

/**
 * Pergunta, antes de criar a coluna Empresa, se as empresas cadastradas entram sozinhas.
 * A resposta vira `autoAddCompanies`. `onChoose` devolve a mensagem de erro (ou null).
 * Enquanto cria, Esc não fecha; o erro aparece dentro do modal.
 */
export function CompanySyncDialog({
  onClose,
  onChoose,
}: {
  onClose: () => void;
  onChoose: (autoAddCompanies: boolean) => Promise<string | null>;
}) {
  const { actions } = useSheet();
  const [pending, setPending] = useState<"yes" | "no" | null>(null);
  const [error, setError] = useState<string | null>(null);
  // O X do modal não pode ser bloqueado: se fechar durante a criação, o erro vai para o aviso geral.
  const detached = useRef(false);
  useBlockEscape(pending !== null);

  function close() {
    if (pending) detached.current = true;
    onClose();
  }

  async function choose(auto: boolean) {
    if (pending) return;
    setPending(auto ? "yes" : "no");
    setError(null);
    const message = await onChoose(auto);
    setPending(null);
    if (detached.current) {
      if (message) actions.reportError(message);
      return;
    }
    if (message) setError(message);
    else onClose();
  }

  return (
    <Modal
      open
      onClose={close}
      size="sm"
      closeOnBackdrop={pending === null}
      title="Adicionar automaticamente as empresas cadastradas?"
      footer={
        <>
          <Button variant="secondary" loading={pending === "no"} disabled={pending !== null} onClick={() => void choose(false)}>
            Não, vou escolher manualmente
          </Button>
          <Button loading={pending === "yes"} disabled={pending !== null} onClick={() => void choose(true)}>
            Sim, adicionar automaticamente
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex gap-3 text-sm text-muted">
          <Building2 aria-hidden className="mt-0.5 size-5 shrink-0 text-ring" />
          <div className="flex flex-col gap-2">
            <p>
              As empresas já cadastradas entram agora, uma por linha. As próximas que forem cadastradas entram
              sozinhas nesta tabela.
            </p>
            <p>Você pode mudar isso depois no menu da coluna Empresa.</p>
          </div>
        </div>
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </div>
    </Modal>
  );
}
