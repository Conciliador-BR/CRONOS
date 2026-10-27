import { z } from "zod";
import { parseBrlToCents } from "@/lib/format/money";
import { parsePercent, text } from "./form-utils";

export const ROLES = ["admin", "gestor", "funcionario"] as const;

export const teamSchema = z.object({
  name: z.string().trim().min(1, { error: "Informe o nome do time." }).max(80, { error: "Até 80 caracteres." }),
});

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Até ${max} caracteres.` })
    .transform((v) => (v === "" ? null : v));

/** Meta em reais ("15.000,00"); vazio = sem meta. */
export const goalField = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (v === "") return null;
    const cents = parseBrlToCents(v);
    if (cents === null) {
      ctx.addIssue({ code: "custom", message: "Valor inválido. Ex.: 15.000,00" });
      return z.NEVER;
    }
    return cents;
  });

export const passwordField = z
  .string()
  .min(8, { error: "A senha precisa de pelo menos 8 caracteres." })
  .max(72, { error: "Até 72 caracteres." });

const employeeBase = z.object({
  fullName: z.string().trim().min(1, { error: "Informe o nome." }).max(120, { error: "Até 120 caracteres." }),
  phone: optional(30),
  jobTitle: optional(80),
  teamId: z
    .string()
    .trim()
    .refine((v) => v === "" || z.uuid().safeParse(v).success, { error: "Time inválido." })
    .transform((v) => (v === "" ? null : v)),
  role: z.enum(ROLES, { error: "Escolha o papel." }),
  commissionRate: z.string().transform((v, ctx) => {
    const value = v.trim() === "" ? 0 : parsePercent(v);
    if (value === null || value > 100) {
      ctx.addIssue({ code: "custom", message: "Use um percentual entre 0 e 100." });
      return z.NEVER;
    }
    return value;
  }),
  goal: goalField,
});

export const employeeCreateSchema = employeeBase.extend({
  email: z.email({ error: "E-mail inválido." }).transform((v) => v.toLowerCase()),
  password: passwordField,
});

export const employeeUpdateSchema = employeeBase;

export function readEmployeeForm(formData: FormData) {
  return {
    fullName: text(formData, "fullName"),
    email: text(formData, "email"),
    password: typeof formData.get("password") === "string" ? String(formData.get("password")) : "",
    phone: text(formData, "phone"),
    jobTitle: text(formData, "jobTitle"),
    teamId: text(formData, "teamId"),
    role: text(formData, "role"),
    commissionRate: text(formData, "commissionRate"),
    goal: text(formData, "goal"),
  };
}
