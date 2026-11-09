"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { createSheet } from "../sheet-actions";

/** Criar tabela (nome e descrição) e abrir em seguida. */
export function SheetFormModal({ onClose, defaultName = "" }: { onClose: () => void; defaultName?: string }) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      const result = await createSheet({ name, description });
      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      onClose();
      router.push(`/operacional/relatorios/${result.id}`);
    } catch {
      setError("Sem conexão com o servidor. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      closeOnBackdrop={false}
      title="Nova tabela"
      description="Uma tabela de acompanhamento, como a “Semana de relatório”."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="sheet-form" loading={pending}>
            Criar tabela
          </Button>
        </>
      }
    >
      <form id="sheet-form" onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
        <Field id="sheet-name" label="Nome" required error={fieldErrors.name}>
          <Input autoFocus maxLength={120} value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field id="sheet-description" label="Descrição" error={fieldErrors.description}>
          <Textarea rows={3} maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} />
        </Field>
        {error && Object.keys(fieldErrors).length === 0 ? <Alert tone="danger">{error}</Alert> : null}
      </form>
    </Modal>
  );
}
