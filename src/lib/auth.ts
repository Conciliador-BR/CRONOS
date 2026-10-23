import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type CurrentProfile = Database["public"]["Tables"]["profiles"]["Row"];

/** Perfil do usuário logado (uma consulta por requisição). */
export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data;
});

/** Exige membro ativo; redireciona para o login caso contrário. */
export async function requireMember() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.active) redirect("/login?erro=inativo");
  return profile;
}

/** Exige um dos papéis informados. Use no início de Server Actions administrativas. */
export async function requireRole(roles: AppRole[]) {
  const profile = await requireMember();
  if (!roles.includes(profile.role)) throw new Error("Acesso negado");
  return profile;
}

export function isManager(profile: Pick<CurrentProfile, "role">) {
  return profile.role === "admin" || profile.role === "gestor";
}
