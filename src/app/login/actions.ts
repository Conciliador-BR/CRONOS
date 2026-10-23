"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "./safe-next";

const schema = z.object({
  email: z.email({ error: "Informe um e-mail válido." }),
  password: z.string().min(1, { error: "Informe sua senha." }),
});

export type LoginState = {
  fieldErrors?: { email?: string[]; password?: string[] };
  formError?: string;
  /** Devolve o e-mail digitado para o campo não esvaziar após erro. */
  email?: string;
};

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const raw = {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, email: raw.email };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    // Mensagem genérica: não revela se o e-mail existe.
    return { formError: "E-mail ou senha incorretos.", email: raw.email };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("active")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile?.active) {
    await supabase.auth.signOut();
    return { formError: "Seu acesso ainda não foi liberado pelo administrador.", email: raw.email };
  }

  redirect(safeNextPath(formData.get("next")));
}
