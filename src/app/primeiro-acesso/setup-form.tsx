"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createFirstAdmin, type SetupState } from "./actions";

const initialState: SetupState = {};

export function SetupForm() {
  const [state, formAction, pending] = useActionState(createFirstAdmin, initialState);

  if (state.status === "verify") {
    return (
      <div role="status" className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-ring ring-1 ring-primary/30">
          <MailCheck aria-hidden className="size-5" />
        </span>
        <p className="font-medium">Verifique seu e-mail</p>
        <p className="text-sm text-muted text-pretty">
          Enviamos um link de confirmação para <strong className="text-fg">{state.values?.email}</strong>. Depois de
          confirmar, entre com sua senha.
        </p>
        <Link href="/login" className={buttonVariants({ variant: "secondary", className: "mt-2 w-full" })}>
          Ir para o login
        </Link>
      </div>
    );
  }

  if (state.status === "closed") return <SetupClosed />;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      {state.formError ? <Alert tone="danger">{state.formError}</Alert> : null}

      <Field id="fullName" label="Nome completo" error={state.fieldErrors?.fullName} required>
        <Input
          name="fullName"
          autoComplete="name"
          defaultValue={state.values?.fullName}
          key={`n-${state.values?.fullName ?? ""}`}
          autoFocus
        />
      </Field>

      <Field id="email" label="E-mail" error={state.fieldErrors?.email} required>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          defaultValue={state.values?.email}
          key={`e-${state.values?.email ?? ""}`}
        />
      </Field>

      <Field
        id="password"
        label="Senha"
        hint="Mínimo de 8 caracteres."
        error={state.fieldErrors?.password}
        required
      >
        <Input name="password" type="password" autoComplete="new-password" minLength={8} />
      </Field>

      <Button type="submit" size="lg" loading={pending} className="mt-2 w-full">
        {pending ? "Criando conta…" : "Criar conta"}
      </Button>
    </form>
  );
}

export function SetupClosed() {
  return (
    <div className="flex flex-col gap-4">
      <Alert tone="info" title="Primeiro acesso já realizado">
        O administrador do CRONOS já foi criado. Novos acessos são cadastrados por ele em Configurações.
      </Alert>
      <Link href="/login" className={buttonVariants({ className: "w-full" })}>
        Ir para o login
      </Link>
    </div>
  );
}
