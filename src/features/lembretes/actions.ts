"use server";

import { requireMember } from "@/lib/auth";
import { getMyReminders } from "./queries";
import type { Reminder } from "./reminders";

/** Atualiza os lembretes com a página aberta (o cliente chama a cada 5 min). Só leitura. */
export async function refreshReminders(): Promise<Reminder[]> {
  await requireMember();
  return getMyReminders();
}
