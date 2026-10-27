import { z } from "zod";
import { parseBrlToCents } from "@/lib/format/money";
import { DEAL_TYPES, LEAD_SOURCES, LEAD_TEMPERATURES, PIPELINE_STAGES } from "./constants";
import { isMonthKey, type MonthKey } from "./lib/months";

/** Teto de valor aceito (R$ 1 bilhão) para evitar digitação absurda. */
const MAX_CENTS = 100_000_000_000;

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => (value ? value : null));

const emailCheck = z.email();

const leadFields = z.object({
  name: z.string().trim().min(1, "Informe o nome do lead.").max(160, "Use até 160 caracteres."),
  companyName: optionalText(200, "Use até 200 caracteres."),
  email: optionalText(160, "Use até 160 caracteres.").refine(
    (value) => value === null || emailCheck.safeParse(value).success,
    "Informe um e-mail válido.",
  ),
  phone: optionalText(30, "Use até 30 caracteres."),
  source: z.enum(LEAD_SOURCES, "Escolha a origem."),
  referrerName: optionalText(160, "Use até 160 caracteres."),
  temperature: z.enum(LEAD_TEMPERATURES, "Escolha quente ou frio."),
  description: optionalText(5000, "Use até 5.000 caracteres."),
  ownerId: z
    .string()
    .optional()
    .transform((value) => (value ? value : null))
    .pipe(z.uuid("Responsável inválido.").nullable()),
});

function requireReferrer<T extends { source: string; referrerName: string | null }>(data: T, ctx: z.RefinementCtx) {
  if (data.source === "indicacao" && !data.referrerName) {
    ctx.addIssue({ code: "custom", path: ["referrerName"], message: "Informe quem indicou." });
  }
}

export const createLeadSchema = leadFields.superRefine(requireReferrer);
export type CreateLeadInput = z.input<typeof createLeadSchema>;

/** Valor em reais digitado ("1.234,56") convertido para centavos. */
const moneyText = (options: { allowZero: boolean }) =>
  z
    .string()
    .trim()
    .min(1, "Informe o valor.")
    .transform((value, ctx) => {
      const cents = parseBrlToCents(value);
      if (cents === null || cents > MAX_CENTS || (!options.allowZero && cents <= 0)) {
        ctx.addIssue({ code: "custom", message: "Informe um valor válido, ex.: 1.500,00." });
        return z.NEVER;
      }
      return cents;
    });

export const updateLeadSchema = leadFields
  .extend({
    id: z.uuid("Lead inválido."),
    dealType: z.enum(DEAL_TYPES).optional(),
    dealValue: moneyText({ allowZero: false }).optional(),
    lostReason: optionalText(2000, "Use até 2.000 caracteres."),
  })
  .superRefine(requireReferrer);
export type UpdateLeadInput = z.input<typeof updateLeadSchema>;

export const moveLeadSchema = z.object({
  leadId: z.uuid("Lead inválido."),
  toStage: z.enum(PIPELINE_STAGES, "Etapa inválida."),
  position: z.number().finite("Posição inválida."),
  dealType: z.enum(DEAL_TYPES, "Escolha o tipo de negócio.").optional(),
  dealValue: moneyText({ allowZero: false }).optional(),
  lostReason: optionalText(2000, "Use até 2.000 caracteres."),
});
export type MoveLeadInput = z.input<typeof moveLeadSchema>;

export const closeDealSchema = z.object({
  dealType: z.enum(DEAL_TYPES, "Escolha Consultoria avançada ou Somente o sistema."),
  dealValue: moneyText({ allowZero: false }),
});

export const loseLeadSchema = z.object({
  lostReason: z.string().trim().min(1, "Conte por que o cliente não fechou.").max(2000, "Use até 2.000 caracteres."),
});

export const leadIdSchema = z.uuid("Lead inválido.");

export const salesGoalSchema = z.object({
  profileId: z.uuid("Funcionário inválido."),
  month: z.string().refine(isMonthKey, "Mês inválido.").transform((value) => value as MonthKey),
  goal: moneyText({ allowZero: true }),
});
export type SalesGoalInput = z.input<typeof salesGoalSchema>;
