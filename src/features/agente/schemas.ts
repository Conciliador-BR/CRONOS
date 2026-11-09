import { z } from "zod";
import { isValidCnpj, onlyDigits } from "@/lib/format/document";
import { boardInputSchema, cardCreateSchema, listCreateSchema } from "@/features/operacional/missoes/schemas";

/** Limites da entrada do agente. Áudio: ~2 min em opus cabem com folga em 5 MB. */
export const MAX_TEXT = 2000;
export const MAX_AUDIO_BYTES = 5 * 1024 * 1024;
export const AUDIO_TYPES = ["audio/webm", "audio/ogg", "audio/mp4"] as const;
export type AudioType = (typeof AUDIO_TYPES)[number];

/** Tipo do áudio declarado (sem `;codecs=`) se as primeiras bytes confirmarem; senão null. */
export function audioType(declared: string, head: Uint8Array): AudioType | null {
  const type = declared.split(";")[0].trim().toLowerCase();
  const at = (sig: number[], offset = 0) => sig.every((b, i) => head[offset + i] === b);
  if (type === "audio/webm") return at([0x1a, 0x45, 0xdf, 0xa3]) ? type : null; // EBML
  if (type === "audio/ogg") return at([0x4f, 0x67, 0x67, 0x53]) ? type : null; // OggS
  if (type === "audio/mp4") return at([0x66, 0x74, 0x79, 0x70], 4) ? type : null; // ....ftyp
  return null;
}

/** No máximo estas propostas por pedido; o resto é ignorado. */
export const MAX_PROPOSALS = 5;
/** No máximo estes cards criados junto com uma lista nova. */
export const MAX_LIST_CARDS = 10;

export const cnpjSchema = z
  .string()
  .max(30)
  .transform(onlyDigits)
  .refine((d) => d.length === 14 && isValidCnpj(d), { error: "CNPJ inválido (dígitos verificadores)." });

/** Argumentos que voltam do cliente para executar: não confiáveis, revalidados aqui. */
export const executeInputSchema = z.discriminatedUnion(
  "tool",
  [
    z.object({ tool: z.literal("criar_card"), args: z.strictObject(cardCreateSchema.shape) }),
    z.object({
      tool: z.literal("criar_lista"),
      args: z.strictObject({ ...listCreateSchema.shape, cards: z.array(cardCreateSchema.shape.title).max(MAX_LIST_CARDS) }),
    }),
    z.object({ tool: z.literal("criar_quadro"), args: z.strictObject(boardInputSchema.shape) }),
    z.object({ tool: z.literal("cadastrar_empresa"), args: z.strictObject({ cnpj: cnpjSchema }) }),
  ],
  { error: "Ferramenta desconhecida." },
);
export type ExecuteInput = z.infer<typeof executeInputSchema>;

/** Texto de um argumento do modelo: só string, aparada e cortada; o resto vira "" (falta vira aviso). */
export const modelText = (args: Record<string, unknown> | undefined, key: string, max: number) => {
  const value = args?.[key];
  return typeof value === "string" ? value.trim().slice(0, max) : "";
};

/** Declarações das ferramentas para o Gemini (JSON Schema). */
export const FUNCTION_DECLARATIONS = [
  {
    name: "criar_card",
    description: "Cria um card (cartão) numa lista de um quadro de Missões.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        titulo: { type: "string", description: "Título do card." },
        quadro: { type: "string", description: "Nome do quadro, como aparece na lista de quadros." },
        lista: { type: "string", description: "Nome da lista (coluna) dentro do quadro." },
      },
      required: ["titulo", "quadro", "lista"],
    },
  },
  {
    name: "criar_lista",
    description:
      "Cria uma lista (coluna) nova num quadro existente de Missões. Para criar cards dentro dessa lista nova, informe os títulos em cards (não use criar_card para ela).",
    parametersJsonSchema: {
      type: "object",
      properties: {
        quadro: { type: "string", description: "Nome do quadro, como aparece na lista de quadros." },
        nome: { type: "string", description: "Nome da lista nova." },
        cards: { type: "array", items: { type: "string" }, description: "Títulos de cards a criar dentro da lista nova (opcional)." },
      },
      required: ["quadro", "nome"],
    },
  },
  {
    name: "criar_quadro",
    description: "Cria um quadro novo em Missões (vazio, sem listas).",
    parametersJsonSchema: {
      type: "object",
      properties: { nome: { type: "string", description: "Nome do quadro." } },
      required: ["nome"],
    },
  },
  {
    name: "cadastrar_empresa",
    description: "Cadastra uma empresa a partir do CNPJ; os dados vêm da base pública da Receita.",
    parametersJsonSchema: {
      type: "object",
      properties: { cnpj: { type: "string", description: "CNPJ com 14 dígitos, com ou sem pontuação." } },
      required: ["cnpj"],
    },
  },
];
