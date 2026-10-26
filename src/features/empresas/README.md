# Empresas

Mapa do Brasil (`/empresas`) com um ponto em cada mercado, lista de mercados do estado e card lateral com o detalhe do cliente.

**Responsável:** Dev Empresas & Configurações.

## Dados

`companies` (UF, nome do mercado, endereço), `clients`, `company_ec_numbers`. Dados bancários (`company_bank_accounts`) e PDFs (`company_documents`, bucket `company-docs`) só aparecem para admin/gestor; a RLS já devolve vazio para os demais.

## Estrutura esperada

```
src/features/empresas/
  components/     UI do módulo (Server Components por padrão; "use client" só onde há interação)
  actions.ts      Server Actions ("use server"): validam com Zod, chamam requireMember/requireRole antes de escrever
  queries.ts      Leituras no servidor (import "server-only"; createClient de @/lib/supabase/server)
  schemas.ts      Schemas Zod compartilhados por formulários e ações
  *.test.ts       Testes Vitest de lógica pura (cálculos, transformações, regras)
```

## Regras

- As páginas em `src/app/(app)/empresas` ficam finas: leem com `queries.ts` e renderizam `components/`.
- Componentes cliente nunca importam `queries.ts`, `@/lib/auth`, `@/lib/supabase/server` ou `@/lib/supabase/admin`.
- Toda Server Action começa com `requireMember()` ou `requireRole([...])` e valida a entrada com Zod antes de tocar no banco. A RLS é a proteção real; a checagem na ação dá mensagem clara e evita trabalho inútil.
- Dinheiro em centavos (`number` inteiro) com `@/lib/format/money`.
- Arquivos até 350 linhas; um escritor por arquivo (ver `TASKS.md`).

## Implementado

- `/empresas`: mapa MapLibre (`components/company-map.tsx`, camadas em `map-layers.ts`, pinos e grupos HTML em `map-markers.ts`, nuvem em `cloud-overlay.tsx`) + painel com busca, resumo e mercados do estado (`components/empresas-explorer.tsx`, `explorer-panel.tsx`). A UF fica em `?uf=SP`; o card abre pela URL `?empresa=<id>` (`components/company-drawer.tsx`), lido no servidor por `getCompanyDetail` (inclui CNAE, matriz e filiais).
- Estilo base CARTO Dark Matter com fallback local (`map-style.ts`); contornos das UFs em `public/geo/br-uf.json` (IBGE, via geodata-br-states); caixas/centros por UF em `uf-geo.ts`; GeoJSON dos pinos e posição aproximada (sem coordenadas) em `geo.ts`; máscara do CNAE em `cnae.ts`.
- Contas bancárias e PDFs só são consultados para admin/gestor; download por URL assinada de 60 s (`actions.ts` → `getCompanyDocumentUrl`).
- CSS global com prefixo `em-` (`components/empresas-map.css`, `components/company-drawer.css`, `map-theme.css`): o projeto não usa CSS Modules.
- Lógica pura testada: `map-utils.test.ts`, `geo.test.ts`, `cnae.test.ts`, `format.test.ts`.
