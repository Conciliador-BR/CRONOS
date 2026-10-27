// Gate assíncrono tipado do vibe-coding-toolkit (next.typed, revisão 790a895). Roda à parte: `pnpm lint:typed`.
import defaultConfig from "./eslint.config.mjs";

const config = [
  ...defaultConfig,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      // 37 violações legadas em 2026-10-27 (handlers async em atributos JSX); começa em warn.
      // Plano de redução e contagem: docs/quality.md. Promover a "error" quando zerar.
      "@typescript-eslint/no-misused-promises": "warn",
    },
  },
];

export default config;
