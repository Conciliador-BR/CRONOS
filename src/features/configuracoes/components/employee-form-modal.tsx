"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/nav";
import type { ActionResult } from "../action-result";
import { createEmployee, updateEmployee } from "../employee-actions";
import { AVATAR_TYPES, MAX_AVATAR_BYTES } from "../limits";
import type { EmployeeRow } from "../queries";
import { centsToInput } from "./money-input";

type Props = {
  employee: EmployeeRow | null;
  teams: { id: string; name: string }[];
  isSelf: boolean;
  onClose: () => void;
  onSaved: (result: Extract<ActionResult, { ok: true }>) => void;
};

/** Cadastro (cria login) ou edição de funcionário. Só admin. */
export function EmployeeFormModal({ employee, teams, isSelf, onClose, onSaved }: Props) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [preview, setPreview] = useState<string | null>(employee?.avatarUrl ?? null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const errors = result && !result.ok ? result.fieldErrors : undefined;
  const creating = employee === null;

  function onPhoto(file: File | undefined) {
    setPhotoError(null);
    if (!file) return;
    if (!Object.hasOwn(AVATAR_TYPES, file.type)) setPhotoError("Use uma foto PNG, JPG ou WebP.");
    else if (file.size > MAX_AVATAR_BYTES) setPhotoError("A foto pode ter até 5 MB.");
    else setPreview(URL.createObjectURL(file));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (photoError) return;
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const next = creating ? await createEmployee(formData) : await updateEmployee(employee.id, formData);
      if (next.ok) onSaved(next);
      else setResult(next);
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      closeOnBackdrop={false}
      size="lg"
      title={creating ? "Novo funcionário" : `Editar ${employee.fullName}`}
      description={creating ? "Cria o login com e-mail e senha inicial." : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" form="employee-form" loading={pending}>
            {pending ? "Salvando…" : creating ? "Cadastrar funcionário" : "Salvar alterações"}
          </Button>
        </>
      }
    >
      <form id="employee-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {result && !result.ok ? <Alert tone="danger">{result.error}</Alert> : null}
        <div className="flex items-center gap-4">
          <Avatar name={employee?.fullName ?? "Novo funcionário"} src={preview} size="lg" />
          <Field id="employee-avatar" label="Foto" error={photoError ?? errors?.avatar} hint="PNG, JPG ou WebP, até 5 MB." className="flex-1">
            <Input
              name="avatar"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => onPhoto(e.target.files?.[0])}
              className="py-2 file:mr-3 file:rounded-md file:border-0 file:bg-surface-2 file:px-3 file:py-1 file:text-sm file:text-fg"
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="employee-name" label="Nome" required error={errors?.fullName} className="sm:col-span-2">
            <Input name="fullName" defaultValue={employee?.fullName ?? ""} maxLength={120} autoComplete="off" autoFocus />
          </Field>
          {creating ? (
            <>
              <Field id="employee-email" label="E-mail" required error={errors?.email}>
                <Input name="email" type="email" autoComplete="off" spellCheck={false} placeholder="nome@empresa.com.br" />
              </Field>
              <Field id="employee-password" label="Senha inicial" required error={errors?.password} hint="Mínimo de 8 caracteres.">
                <Input name="password" type="password" autoComplete="new-password" minLength={8} />
              </Field>
            </>
          ) : (
            <Field id="employee-email" label="E-mail" hint="O e-mail do login não é alterado por aqui." className="sm:col-span-2">
              <Input value={employee.email} readOnly disabled />
            </Field>
          )}
          <Field id="employee-phone" label="Telefone" error={errors?.phone}>
            <Input name="phone" type="tel" defaultValue={employee?.phone ?? ""} maxLength={30} autoComplete="off" />
          </Field>
          <Field id="employee-job" label="Cargo" error={errors?.jobTitle}>
            <Input name="jobTitle" defaultValue={employee?.jobTitle ?? ""} maxLength={80} autoComplete="off" placeholder="Ex.: Consultor comercial" />
          </Field>
          <Field id="employee-team" label="Time" error={errors?.teamId}>
            <Select name="teamId" defaultValue={employee?.teamId ?? ""} placeholder="Sem time">
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            id="employee-role"
            label="Papel"
            required
            error={errors?.role}
            hint={isSelf ? "Você não pode alterar o seu próprio papel." : undefined}
          >
            <Select name="role" defaultValue={employee?.role ?? "funcionario"} disabled={isSelf}>
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          {isSelf ? <input type="hidden" name="role" value="admin" /> : null}
          <Field id="employee-commission" label="Comissão (%)" error={errors?.commissionRate}>
            <Input
              name="commissionRate"
              inputMode="decimal"
              defaultValue={employee ? String(employee.commissionRate).replace(".", ",") : ""}
              placeholder="0"
            />
          </Field>
          <Field id="employee-goal" label="Meta do mês (R$)" error={errors?.goal} hint="Vazio = sem meta neste mês.">
            <Input name="goal" inputMode="decimal" defaultValue={centsToInput(employee?.goalCents ?? null)} placeholder="0,00" />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
