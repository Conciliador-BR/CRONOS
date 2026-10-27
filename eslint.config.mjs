// Perfil Next do vibe-coding-toolkit (eslint-rules/, revisão 790a895) adaptado ao CRONOS.
import { defineConfig } from "eslint/config";
import base from "./eslint-rules/next-base.mjs";

export default defineConfig([
  ...base,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      // Servidor usa o Pino de `@/lib/logger`; o cliente não deixa saída de depuração.
      "quality/no-direct-console": ["error", { logger: "o logger de `@/lib/logger` (no cliente, remova a saída)" }],
      // Componentes e telas (.tsx) não criam clientes Supabase de servidor/admin;
      // a leitura passa por `src/features/<módulo>/queries.ts` e a escrita por Server Actions.
      "quality/no-direct-data-access": ["error", {
        modules: ["@/lib/supabase/server", "@/lib/supabase/admin"],
        bindings: ["createClient", "createAdminClient"],
        layers: ["/src/components/"],
        extensions: [".tsx"],
      }],
    },
  },
  {
    // Gerado por `supabase gen types`; não é código escrito à mão.
    files: ["src/lib/supabase/database.types.ts"],
    rules: { "quality/max-lines": "off" },
  },
  {
    // Error boundaries do cliente registram o erro no console do navegador (padrão do Next);
    // o servidor já registra o mesmo erro com o `digest`.
    files: ["src/app/**/error.tsx", "src/app/**/global-error.tsx"],
    rules: { "quality/no-direct-console": "off" },
  },
]);
