import "server-only";
import { z } from "zod";
import { logLevelSchema, parseEnv } from "./env-schema";

export function getLogLevel() {
  return parseEnv("LOG_LEVEL", process.env.LOG_LEVEL, logLevelSchema);
}

/** Chave service role: só para operações administrativas (criar logins de funcionários). */
export function getServiceRoleKey() {
  return parseEnv("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY, z.string().min(20));
}

export function hasServiceRoleKey() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
