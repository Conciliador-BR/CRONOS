import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { signDisplayUrls } from "@/lib/supabase/signed-urls";
import type { Member } from "./types";

/** Funcionários ativos (com foto assinada), em ordem alfabética. */
export const getActiveMembers = cache(async (): Promise<Member[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_path")
    .eq("active", true)
    .order("full_name");
  const rows = data ?? [];
  const paths = rows.map((row) => row.avatar_path).filter((path): path is string => Boolean(path));
  const urls = await signDisplayUrls(supabase, "avatars", paths);
  return rows.map((row) => ({
    id: row.id,
    name: row.full_name || row.email || "Sem nome",
    avatarUrl: row.avatar_path ? (urls.get(row.avatar_path) ?? null) : null,
  }));
});
