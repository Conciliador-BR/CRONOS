# CRONOS — Design

Guia visual e de componentes. Quem constrói telas usa os **tokens** e o **kit de UI** daqui; não crie cores ou botões avulsos.

## Direção visual

- **Preto e azul, tema escuro único.** Fundo quase preto com leve tom azul; superfícies em camadas de azul-marinho; azul forte (`primary`) só para ação principal, foco e destaques.
- **Calmo e denso.** É uma ferramenta de trabalho diário: tipografia Geist, texto 14 px nas telas internas, espaçamento em múltiplos de 4 px, cantos `rounded-lg` (controles) e `rounded-xl` (cartões).
- **Cor com significado.** Verde = sucesso/fechado, âmbar = atenção/atraso, vermelho = erro/perdido/destrutivo. Nunca use só a cor para comunicar estado: acompanhe com texto ou ícone.
- **Sem imagens externas.** Ilustrações são composições de UI (como a prévia do pipeline na página `/`) ou ícones `lucide-react`.

## Tokens

Definidos em `src/app/globals.css` e expostos ao Tailwind como `bg-*`, `text-*`, `border-*`, `ring-*`, `outline-*`. **Os nomes são contrato**: valores podem ser ajustados, nomes não.

| Token | Valor | Uso |
|---|---|---|
| `bg` | `#05070d` | Fundo da página |
| `surface` | `#0b1020` | Cartões, painéis, campos |
| `surface-2` | `#111a33` | Hover, colunas de quadro, botão secundário |
| `surface-3` | `#18233f` | Hover do secundário, elementos elevados |
| `border` | `#1e2a4a` | Bordas e divisórias |
| `fg` | `#e6ecff` | Texto principal |
| `muted` | `#8a97b8` | Texto secundário, rótulos, placeholders |
| `primary` | `#2563eb` | Ação principal, aba ativa, seleção |
| `primary-hover` | `#1d4ed8` | Hover da ação principal |
| `primary-fg` | `#ffffff` | Texto sobre `primary` |
| `accent` | `#38bdf8` | Detalhes (ponteiro do logo, indicadores) |
| `success` | `#22c55e` | Concluído, cliente fechado |
| `warning` | `#f59e0b` | Atenção, prazo próximo/atrasado |
| `danger` | `#ef4444` | Erro, exclusão, cliente perdido |
| `ring` | `#60a5fa` | Contorno de foco; também azul claro para texto/ícone sobre fundo azul translúcido |

Transparências: use o modificador do Tailwind (`bg-primary/15`, `border-danger/40`). Animações disponíveis: `animate-fade-in`, `animate-pop-in`, `animate-slide-in-left`, `animate-slide-in-right`.

## Componentes (`src/components/ui/`)

Importe do arquivo (`@/components/ui/button`) ou do barrel (`@/components/ui`). Todos aceitam `className` (mesclado com `cn`). Os marcados com **cliente** usam `"use client"`.

| Componente | Uso |
|---|---|
| `Button` | `variant`: `primary` (uma por tela/área), `secondary`, `ghost` (ações de baixa ênfase, barras), `danger` (destrutivo). `size`: `sm`, `md`, `lg`, `icon` (exige `aria-label`). `loading` mostra spinner e desabilita. Padrão `type="button"`. |
| `buttonVariants()` | Classes do botão para `<Link>`/`<a>`: `className={buttonVariants({ variant: "secondary" })}`. |
| `Input`, `Textarea`, `Select` | Controles nativos estilizados. `Select` aceita `placeholder` (primeira opção vazia). Erro aparece com `aria-invalid`. |
| `Label` | Rótulo; `required` mostra asterisco. |
| `Field` | Rótulo + controle + dica/erro. Recebe `id`, `label`, `error` (string ou lista do Zod), `hint`, `required` e **um** controle como filho; injeta `id`, `aria-invalid` e `aria-describedby`. |
| `Card` + `CardHeader`, `CardTitle` (`as` h2/h3/h4), `CardDescription`, `CardContent`, `CardFooter` | Agrupamento de conteúdo. |
| `Badge` | `variant`: `neutral`, `primary`, `success`, `warning`, `danger`; `color="#rrggbb"` para etiquetas livres (texto clareado automaticamente para manter contraste); `dot`. |
| `Avatar` (cliente) | `name` (obrigatório), `src`, `size` `xs`–`xl`. Sem foto ou com erro: iniciais em tom azul estável por nome. |
| `Modal` (cliente) | `<dialog>` nativo: `open`, `onClose`, `title`, `description`, `footer`, `size` `sm`–`xl`, `closeOnBackdrop`. |
| `Drawer` (cliente) | Painel lateral: `side` `left` (menu ≡ do Operacional) ou `right` (detalhes), `size` `sm`/`md`/`lg`, mesmas props do Modal. Tela cheia no celular. |
| `Tabs` (cliente) | `items: { value, label, content?, disabled? }[]`, `label` (nome acessível), controlado (`value` + `onValueChange`) ou não (`defaultValue`). |
| `EmptyState` | `icon` (componente lucide), `title`, `description`, `action`. |
| `Alert` | `tone`: `info`, `success`, `warning`, `danger`; `title`; filhos. |
| `Spinner` | `label` opcional para leitores de tela. |
| `Logo`, `LogoMark` | `variant="full"` (símbolo + nome) ou `"mark"`. Arquivo estático: `public/logo.svg`. |

## Acessibilidade (critérios de aceite)

- **Contraste** AA: texto normal ≥ 4,5:1, texto grande e ícones ≥ 3:1. Pares validados: `fg`/`bg` ≈ 17:1, `muted`/`bg` ≈ 7:1, `muted`/`surface-2` ≈ 5,9:1, `muted`/`surface-3` ≈ 5,3:1, `primary-fg`/`primary` ≈ 5,2:1, `danger`/`bg` ≈ 5,3:1. Evite `muted` com opacidade reduzida em texto pequeno.
- **Foco visível** em tudo que é interativo: contorno `ring` de 2 px (global em `:focus-visible`). Nunca remova `outline` sem substituto.
- **Teclado**: todo fluxo funciona sem mouse. Modal/Drawer prendem o foco, fecham com Esc e devolvem o foco ao gatilho (comportamento do `<dialog>` nativo). Abas navegam com setas, Home e End.
- **Semântica**: um `h1` por página; botões para ações, links para navegação; botões só com ícone têm `aria-label`; ícones decorativos com `aria-hidden`.
- **Formulários**: todo campo tem rótulo; erro em texto ao lado do campo, ligado por `aria-describedby`; erro geral do formulário em `Alert` (`role="alert"`); `autocomplete` e `type` corretos (`email`, `current-password`, `new-password`).
- **Movimento reduzido**: `prefers-reduced-motion` zera animações e transições globalmente. Animações só reforçam, nunca carregam informação.
- **Alvos de toque** ≥ 40 px nas ações principais (`size="md"` ou maior) e layout mobile-first sem rolagem horizontal da página.

## Padrões

### Formulários
1. Server Action com Zod; retorne `{ fieldErrors, formError, values }`.
2. Cliente com `useActionState`; cada campo em `Field` com `error={state.fieldErrors?.campo}`.
3. Botão de envio com `loading={pending}` e texto no gerúndio ("Salvando…").
4. Preserve o que foi digitado após erro (`defaultValue` + `key`). Nunca devolva senhas.
5. Validação no servidor é a fonte da verdade; atributos HTML (`required`, `minLength`) são apenas ajuda.

### Modais e gavetas
- Modal para decisões curtas e formulários pequenos (ex.: "Cliente fechado: tipo e valor"). Drawer para navegação secundária e detalhes longos.
- Título claro e verbo no botão principal ("Salvar lead", não "OK"). Cancelar como `secondary` à esquerda do principal.
- Formulários com dados digitados: `closeOnBackdrop={false}` no Modal para evitar perda acidental.
- Ação destrutiva: botão `danger` e texto explicando o que será perdido.
- Para focar o primeiro campo ao abrir, use `autoFocus` nele.

### Estados vazios, carregando e erro
- Lista vazia: `EmptyState` com ícone do módulo, frase do que falta e a ação para criar ("Nenhuma missão neste quadro" + "Nova missão"). Se o usuário não pode criar, omita a ação e diga quem pode.
- Carregando: `loading.tsx` com esqueletos em `bg-surface-2 animate-pulse` no formato do conteúdo; `Spinner` só em ações pontuais.
- Erro: `Alert tone="danger"` com o que aconteceu e o que fazer; nunca mostre mensagens técnicas do banco.

### Texto
- Português do Brasil, frases curtas, sentença com inicial maiúscula ("Nova empresa", não "Nova Empresa").
- Valores em `R$` com `lib/format/money.ts`; números alinhados com `tabular-nums`.
