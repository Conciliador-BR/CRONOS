"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { needsSetup } from "./needs-setup";

const schema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { error: "Informe seu nome completo." })
    .max(120, { error: "Use no máximo 120 caracteres." }),
  email: z.email({ error: "Informe um e-mail válido." }),
  password: z
    .string()
    .min(8, { error: "A senha precisa ter pelo menos 8 caracteres." })
    .max(72, { error: "Use no máximo 72 caracteres." }),
});

export type SetupState = {
  fieldErrors?: { fullName?: string[]; email?: string[]; password?: string[] };
  formError?: string;
  /** "verify": conta criada, falta confirmar o e-mail. */
  status?: "verify" | "closed";
  values?: { fullName: string; email: string };
};

export async function createFirstAdmin(_prev: SetupState, formData: FormData): Promise<SetupState> {
  const raw = {
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };
  const values = { fullName: raw.fullName, email: raw.email };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  // Verifica de novo no servidor: a página pode ter sido aberta antes de outro cadastro.
  if (!(await needsSetup())) return { status: "closed" };

  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: origin ? `${origin}/auth/callback?next=/inicio` : undefined,
    },
  });

  if (error) {
    return { formError: "Não foi possível criar a conta. Confira os dados e tente novamente.", values };
  }
  if (!data.session) return { status: "verify", values };

  redirect("/inicio");
}
