"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { overLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "./safe-next";

const LOGIN_WINDOW_MS = 15 * 60_000;

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

  // O limite do Supabase Auth vê o IP do servidor, não o do atacante: limita aqui por e-mail e por IP.
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "?";
  const now = Date.now();
  if (
    overLimit(`login:ip:${ip}`, now, 20, LOGIN_WINDOW_MS) ||
    overLimit(`login:email:${parsed.data.email.toLowerCase()}`, now, 5, LOGIN_WINDOW_MS)
  ) {
    return { formError: "Muitas tentativas. Aguarde 15 minutos e tente de novo.", email: raw.email };
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
