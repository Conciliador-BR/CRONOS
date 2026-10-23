import { z } from "zod";
import { parseEnv } from "./env-schema";

// NEXT_PUBLIC_* precisam ser lidas literalmente para o Next embutir no bundle do cliente.
export function getSupabasePublicEnv() {
  return {
    url: parseEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL, z.url()),
    publishableKey: parseEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      z.string().min(20),
    ),
  };
}
