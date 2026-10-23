import { z } from "zod";
import { isValidCnpj, onlyDigits } from "@/lib/format/document";
import { UFS } from "@/features/empresas/brazil-states";
import { isValidCpf, readRows, text } from "./form-utils";

/** Texto opcional: vazio vira null; limita o tamanho. */
const optional = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, { error: `${label}: até ${max} caracteres.` })
    .transform((v) => (v === "" ? null : v));

const required = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, { error: `Informe ${label}.` })
    .max(max, { error: `Até ${max} caracteres.` });

export const clientSchema = z.object({
  name: required(160, "o nome do cliente"),
  document: z
    .string()
    .transform(onlyDigits)
    .refine((d) => d === "" || (d.length === 11 ? isValidCpf(d) : d.length === 14 && isValidCnpj(d)), {
      error: "CPF ou CNPJ inválido.",
    })
    .transform((d) => (d === "" ? null : d)),
  email: z
    .string()
    .trim()
    .max(160, { error: "Até 160 caracteres." })
    .refine((v) => v === "" || z.email().safeParse(v).success, { error: "E-mail inválido." })
    .transform((v) => (v === "" ? null : v.toLowerCase())),
  phone: optional(30, "Telefone"),
  notes: optional(5000, "Observações"),
});
export type ClientInput = z.infer<typeof clientSchema>;

export const ecRowSchema = z.object({
  id: z.uuid().optional(),
  acquirer: required(80, "a adquirente"),
  ecNumber: required(40, "o número do EC"),
});

export const ACCOUNT_TYPES = ["corrente", "poupanca", "pagamento"] as const;

export const bankRowSchema = z.object({
  id: z.uuid().optional(),
  bank: required(80, "o banco"),
  agency: required(10, "a agência"),
  account: required(20, "a conta"),
  accountType: z.enum(ACCOUNT_TYPES, { error: "Escolha o tipo de conta." }),
});

export const companySchema = z
  .object({
    cnpj: z
      .string()
      .transform(onlyDigits)
      .refine((d) => d.length === 14, { error: "O CNPJ tem 14 dígitos." })
      .refine((d) => d.length !== 14 || isValidCnpj(d), { error: "CNPJ inválido (dígitos verificadores)." }),
    legalName: required(200, "a razão social"),
    tradeName: optional(200, "Nome fantasia"),
    marketName: optional(200, "Nome do mercado"),
    cep: z
      .string()
      .transform(onlyDigits)
      .refine((d) => d === "" || d.length === 8, { error: "O CEP tem 8 dígitos." })
      .transform((d) => (d === "" ? null : d)),
    street: optional(200, "Logradouro"),
    number: optional(20, "Número"),
    complement: optional(120, "Complemento"),
    district: optional(120, "Bairro"),
    city: optional(120, "Cidade"),
    uf: z.enum(UFS, { error: "Escolha a UF." }),
    clientMode: z.enum(["none", "existing", "new"]),
    clientId: z.string().trim(),
    client: z.unknown(),
    ecs: z.array(ecRowSchema).max(50, { error: "Até 50 ECs." }),
    banks: z.array(bankRowSchema).max(20, { error: "Até 20 contas." }),
  })
  .superRefine((value, ctx) => {
    if (value.clientMode === "existing" && !z.uuid().safeParse(value.clientId).success) {
      ctx.addIssue({ code: "custom", path: ["clientId"], message: "Escolha um cliente." });
    }
    if (value.clientMode === "new") {
      const parsed = clientSchema.safeParse(value.client);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          ctx.addIssue({ code: "custom", path: ["client", ...issue.path] as PropertyKey[], message: issue.message });
        }
      }
    }
  })
  .transform(({ client, clientId, ...rest }) => ({
    ...rest,
    clientId: rest.clientMode === "existing" ? clientId : null,
    newClient: rest.clientMode === "new" ? clientSchema.parse(client) : null,
  }));
export type CompanyInput = z.infer<typeof companySchema>;

/** Lê o FormData do formulário de empresa no formato do schema. */
export function readCompanyForm(formData: FormData) {
  return {
    cnpj: text(formData, "cnpj"),
    legalName: text(formData, "legalName"),
    tradeName: text(formData, "tradeName"),
    marketName: text(formData, "marketName"),
    cep: text(formData, "cep"),
    street: text(formData, "street"),
    number: text(formData, "number"),
    complement: text(formData, "complement"),
    district: text(formData, "district"),
    city: text(formData, "city"),
    uf: text(formData, "uf").toUpperCase(),
    clientMode: text(formData, "clientMode") || "none",
    clientId: text(formData, "clientId"),
    client: readClientForm(formData, "client."),
    ecs: readRows(formData, "ecs", ["acquirer", "ecNumber"] as const),
    banks: readRows(formData, "banks", ["bank", "agency", "account", "accountType"] as const, [
      "bank",
      "agency",
      "account",
    ]),
  };
}

export function readClientForm(formData: FormData, prefix = "") {
  return {
    name: text(formData, `${prefix}name`),
    document: text(formData, `${prefix}document`),
    email: text(formData, `${prefix}email`),
    phone: text(formData, `${prefix}phone`),
    notes: text(formData, `${prefix}notes`),
  };
}
