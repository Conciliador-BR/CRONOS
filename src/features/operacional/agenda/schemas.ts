import { z } from "zod";
import { HEX_COLOR } from "../shared/colors";
import { isDayKey, isTime } from "../shared/tz";

const dayKey = z.string().refine(isDayKey, { error: "Data inválida." });
const time = z.string().refine(isTime, { error: "Hora inválida." });

export function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export const eventInputSchema = z
  .object({
    title: z.string().trim().min(1, { error: "Informe o título." }).max(200, { error: "Até 200 caracteres." }),
    description: z.string().trim().max(5000, { error: "Até 5.000 caracteres." }),
    location: z.string().trim().max(300, { error: "Até 300 caracteres." }),
    meetingUrl: z
      .string()
      .trim()
      .max(2000, { error: "Link muito longo." })
      .refine((value) => value === "" || isHttpsUrl(value), { error: "Use um link que comece com https://." }),
    color: z.string().regex(HEX_COLOR, { error: "Cor inválida." }),
    allDay: z.boolean(),
    startDay: dayKey,
    startTime: time,
    endDay: dayKey,
    endTime: time,
    attendeeIds: z.array(z.uuid()).max(200),
  })
  .superRefine((value, ctx) => {
    const start = `${value.startDay}T${value.allDay ? "00:00" : value.startTime}`;
    const end = `${value.endDay}T${value.allDay ? "00:00" : value.endTime}`;
    const invalid = value.allDay ? end < start : end <= start;
    if (invalid) ctx.addIssue({ code: "custom", path: ["endTime"], message: "O fim precisa ser depois do início." });
  });

export type EventInput = z.infer<typeof eventInputSchema>;
