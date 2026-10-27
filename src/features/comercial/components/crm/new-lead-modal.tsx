"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { createLead } from "../../actions";
import type { CreateLeadInput } from "../../schemas";
import type { MemberOption } from "../../types";
import { useStages } from "../shared/stages-context";
import { LeadFormFields, readForm, type FieldErrors } from "./lead-form-fields";

const FORM_ID = "novo-lead";

type Props = { members: MemberOption[]; currentUserId: string; onCreated: (name: string) => void };

/** Botão "Novo lead" + modal com o formulário. O lead entra no topo da primeira coluna aberta. */
export function NewLeadButton({ members, currentUserId, onCreated }: Props) {
  const { firstOpen } = useStages();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function close() {
    setOpen(false);
    setError(null);
    setFieldErrors({});
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = readForm(event.currentTarget);
    startTransition(async () => {
      const result = await createLead(values as unknown as CreateLeadInput);
      if (result.ok) {
        setOpen(false);
        setError(null);
        setFieldErrors({});
        onCreated(values.name ?? "");
      } else {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  }

  const isMember = members.some((member) => member.id === currentUserId);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden className="size-4" />
        Novo lead
      </Button>
      <Modal
        open={open}
        onClose={close}
        closeOnBackdrop={false}
        size="lg"
        title="Novo lead"
        description={firstOpen ? `O lead entra em ${firstOpen.label}.` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" form={FORM_ID} loading={pending}>
              {pending ? "Salvando…" : "Salvar lead"}
            </Button>
          </>
        }
      >
        <form id={FORM_ID} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <LeadFormFields
            idPrefix="novo-lead"
            members={members}
            errors={fieldErrors}
            defaults={{ ownerId: isMember ? currentUserId : null }}
            autoFocus
          />
        </form>
      </Modal>
    </>
  );
}
