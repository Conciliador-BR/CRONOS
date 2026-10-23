import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getServiceRoleKey } from "@/lib/env";
import { getSupabasePublicEnv } from "@/lib/public-env";
import type { Database } from "./database.types";

/**
 * Cliente com service role: ignora RLS. Use apenas em Server Actions que já
 * verificaram que o usuário atual é admin (ver requireRole em lib/auth.ts).
 */
export function createAdminClient() {
  return createClient<Database>(getSupabasePublicEnv().url, getServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
