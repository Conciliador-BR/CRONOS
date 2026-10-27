"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.formError ? <Alert tone="danger">{state.formError}</Alert> : null}

      <Field id="email" label="E-mail" error={state.fieldErrors?.email} required>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          placeholder="voce@empresa.com.br"
          defaultValue={state.email}
          key={state.email}
          autoFocus
        />
      </Field>

      <Field id="password" label="Senha" error={state.fieldErrors?.password} required>
        <Input name="password" type="password" autoComplete="current-password" />
      </Field>

      <Button type="submit" size="lg" loading={pending} className="mt-2 w-full">
        {pending ? "Entrando…" : (
          <>
            <LogIn aria-hidden />
            Entrar
          </>
        )}
      </Button>
    </form>
  );
}
