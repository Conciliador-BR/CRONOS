"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { ActionResult } from "../action-result";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  /** Ação destrutiva; o diálogo fecha quando ela retorna ok. */
  onConfirm: () => Promise<ActionResult>;
};

/** Confirmação de ação destrutiva com estado de envio e erro. */
export function ConfirmDialog({ open, onClose, title, description, confirmLabel, pendingLabel, onConfirm }: ConfirmDialogProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (pending) return;
    setError(null);
    onClose();
  }

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await onConfirm();
      if (result.ok) onClose();
      else setError(result.error);
    });
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={pending}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirm} loading={pending}>
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 text-sm text-muted">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <div>{description}</div>
      </div>
    </Modal>
  );
}
