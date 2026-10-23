import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * true quando ainda não existe nenhum usuário (RPC public.cronos_needs_setup).
 * Em erro, retorna false: na dúvida, o primeiro acesso fica fechado.
 */
export async function needsSetup(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cronos_needs_setup");
  if (error) return false;
  return data === true;
}
