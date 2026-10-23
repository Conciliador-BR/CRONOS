# Configurações

Cadastros administrativos (`/configuracoes/*`, só admin/gestor): empresas e clientes, funcionários (com criação de login) e times.

**Responsável:** Dev Empresas & Configurações.

## Dados

`companies`, `company_ec_numbers`, `company_bank_accounts`, `company_documents`, `clients`, `profiles`, `teams`, `sales_goals`; buckets `company-docs` e `avatars`. Criar login de funcionário usa `createAdminClient()` (service role) **somente** dentro de ação que já chamou `requireRole(["admin"])`.

## Estrutura esperada

```
src/features/configuracoes/
  components/     UI do módulo (Server Components por padrão; "use client" só onde há interação)
  actions.ts      Server Actions ("use server"): validam com Zod, chamam requireMember/requireRole antes de escrever
  queries.ts      Leituras no servidor (import "server-only"; createClient de @/lib/supabase/server)
  schemas.ts      Schemas Zod compartilhados por formulários e ações
  *.test.ts       Testes Vitest de lógica pura (cálculos, transformações, regras)
```

## Regras

- As páginas em `src/app/(app)/configuracoes` ficam finas: leem com `queries.ts` e renderizam `components/`.
- Componentes cliente nunca importam `queries.ts`, `@/lib/auth`, `@/lib/supabase/server` ou `@/lib/supabase/admin`.
- Toda Server Action começa com `requireMember()` ou `requireRole([...])` e valida a entrada com Zod antes de tocar no banco. A RLS é a proteção real; a checagem na ação dá mensagem clara e evita trabalho inútil.
- Dinheiro em centavos (`number` inteiro) com `@/lib/format/money`.
- Arquivos até 350 linhas; um escritor por arquivo (ver `TASKS.md`).

## Implementado

- `/configuracoes/empresas`: abas Empresas | Clientes (`?aba=clientes`), `nova` e `[id]` (edição + PDFs).
  - Salvar empresa (`company-actions.ts`): valida (Zod, CNPJ com dígito verificador e único), cria o cliente novo, a empresa e depois ECs/contas. Na criação, se uma parte falhar tudo é desfeito; na edição as linhas filhas são sincronizadas (atualiza, insere e só então remove) e a mensagem diz o que não foi salvo.
  - PDFs (`document-actions.ts`): o servidor valida tipo/tamanho e gera o caminho `<empresa>/<uuid>-<nome>.pdf` e um token de envio; o navegador envia direto ao Storage (o proxy só bufferiza 10 MB do corpo); o servidor confere tamanho e tipo no Storage antes de registrar.
  - CEP: ViaCEP consultado no navegador ao completar 8 dígitos; falha só mostra aviso.
- `/configuracoes/funcionarios` (`employee-actions.ts`): admin cria login (service role, só após `requireRole(["admin"])`), edita, ativa/desativa, redefine senha; gestor vê e define metas. Sem `SUPABASE_SERVICE_ROLE_KEY`, a página avisa e desabilita criação/senha.
- `/configuracoes/times` (`team-actions.ts`): CRUD com contagem de membros.
- Ações devolvem `ActionResult` (`action-result.ts`). Lógica pura testada: `form-utils.test.ts`, `company-schemas.test.ts`, `people-schemas.test.ts`.
