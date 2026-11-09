"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useBlockEscape } from "./use-block-escape";
import { useSheetCommands } from "./use-sheet-commands";

/** "Resetar semana" (só admin): confirma e leva todas as colunas Status para "Não iniciado". */
export function ResetWeekButton() {
  const commands = useSheetCommands();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useBlockEscape(pending);

  function close() {
    if (pending) return;
    setError(null);
    setOpen(false);
  }

  async function reset() {
    setPending(true);
    setError(null);
    const message = await commands.resetWeek(false);
    setPending(false);
    if (message) return setError(message);
    setOpen(false);
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <RotateCcw aria-hidden />
        Resetar semana
      </Button>
      <Modal
        open={open}
        onClose={close}
        size="sm"
        closeOnBackdrop={!pending}
        title="Resetar a semana?"
        description="Todas as colunas Status de todas as linhas voltam para “Não iniciado”. Os outros valores ficam como estão."
        footer={
          <>
            <Button variant="secondary" disabled={pending} onClick={close}>
              Cancelar
            </Button>
            <Button variant="danger" loading={pending} onClick={() => void reset()}>
              Resetar semana
            </Button>
          </>
        }
      >
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </Modal>
    </>
  );
}
