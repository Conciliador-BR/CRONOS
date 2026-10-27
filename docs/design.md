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
6. `<select>` nativo: as opções têm fundo `surface-2` e texto `fg` definidos em `globals.css`. Sem isso, Chrome/Edge no Windows mostram a lista aberta em branco.

### Modais e gavetas
- Modal para decisões curtas e formulários pequenos (ex.: "Cliente fechado: tipo e valor"). Drawer para navegação secundária e detalhes longos.
- Título claro e verbo no botão principal ("Salvar lead", não "OK"). Cancelar como `secondary` à esquerda do principal.
- Formulários com dados digitados: `closeOnBackdrop={false}` no Modal para evitar perda acidental.
- Ação destrutiva: botão `danger` e texto explicando o que será perdido.
- Para focar o primeiro campo ao abrir, use `autoFocus` nele.

### Avisos (toasts) e lembretes
- Sino na barra superior com contador (`primary`) e painel (Popover API: Esc e clique fora fecham). Lista os lembretes ativos com texto e tempo relativo ("Reunião amanhã às 14:00", "Reunião em 45 minutos").
- Avisos no canto inferior direito, até 3 por vez, dentro de uma região `aria-live="polite"` que existe desde a montagem. Cada aviso tem rótulo do limiar ("Falta 1 dia", "Falta 1 hora"), link para a agenda e botão X; Esc com foco no aviso também dispensa. Entrada com `motion-safe:animate-pop-in`.
- Componentes com `position: fixed` não ficam dentro do topo (ele tem `backdrop-filter`): vão por portal para o `<body>` ou pela Popover API.

### Cartão de missão
- Capa (foto) no topo, etiquetas, título, metadados (prazo, descrição, fotos, checklist, membros).
- Bolinha de concluir à esquerda do título: aparece ao passar o mouse ou focar o cartão (sempre em telas de toque) e fica verde com check quando concluída; o título fica `muted` e riscado.
- Menu "…" no canto (Mudar de quadro / lista, Concluir, Arquivar), navegável por setas.
- A superfície de arrastar/abrir fica atrás do visual; a bolinha e o menu são irmãos dela, nunca botões dentro de botão.
- No quadro, um botão flutuante "Mudar de quadro" fica embaixo, no centro (como no Trello), e abre a lista de quadros para trocar de quadro. As listas têm folga inferior para o botão não cobrir cartões.

### Fundos das Missões
- **Papel de parede** (botão "Papel de parede" no topo de `/operacional/missoes`, só para quem escolheu): a foto é a última camada de toda a área de conteúdo, `cover`, presa à janela, com véu escuro (72–86%) para o texto manter contraste.
- **Imagem do quadro** ("Quadro e fundo" no cabeçalho do quadro ou a engrenagem do bloco): a foto é a última camada do quadro, com a cor do quadro por cima como véu translúcido (e como reserva sem foto). Os blocos da grade mostram a foto como miniatura. Listas e cartões continuam com superfície própria.
- Escolher / Trocar / Remover salvam na hora; "Enviando imagem…" e erros ficam logo abaixo dos botões.

### Mapa de Empresas (`/empresas`)
- **MapLibre GL** sobre o estilo vetorial escuro **CARTO Dark Matter** (crédito "© OpenStreetMap contributors © CARTO" no controle de atribuição, que fica sempre visível). É a única exceção à regra de "sem imagens externas". Se a CARTO não responder, o mapa usa um estilo mínimo (fundo `bg` + território em `surface`) e avisa "Mapa de ruas indisponível agora".
- **Estados só como contorno**: linha azul fina (`#3b82f6`, opacidade 0,3–0,55 conforme o zoom); preenchimento `primary` a 10% só no hover e 5% no estado escolhido, com contorno `ring` mais forte. Nunca pintar o estado inteiro.
- **Pino = mercado no local exato** (latitude/longitude do cadastro): bolinha azul com brilho (`ring`/`accent`) e halo pulsante; pino ativo fica mais claro. Sem coordenadas: anel vazado perto do centro da UF ("local aproximado"). Pinos e grupos são `<button>` com `aria-label` (focáveis por Tab).
- **Agrupamento** (cluster) ao afastar: círculo `primary` com a contagem; clique aproxima até separar.
- **Zoom**: roda do mouse/trackpad até o nível da rua (zoom 2,5–18, limitado ao Brasil), botões + e − e teclado (setas, + e −) com o mapa focado. Rotação desligada.
- **Efeito "entrando na nuvem"**: ao clicar num estado (ou num mercado longe), nuvens brancas/azuladas entram das bordas, cobrem a tela e passam pela câmera enquanto o mapa voa (1,7 s). Ao rolar e cruzar de país → estado ou estado → cidade, versão leve (0,95 s), no máximo uma a cada 1,8 s. Só `transform`/`opacity`, `pointer-events: none`, desligado com `prefers-reduced-motion` (os voos ficam instantâneos).
- **Card lateral** (`<dialog>` nativo): entra da direita com mola (passa um pouco e volta, 620 ms), fundo desfocado (5 px) e conteúdo em cascata (cabeçalho, etiquetas, blocos de 55 em 55 ms). Sai deslizando (240 ms). Esc, clique fora e X fecham; o foco fica preso e volta ao pino ou item da lista. No celular vira folha que sobe de baixo (90% da altura, alça no topo).
- Classes globais com prefixo `em-` em `src/features/empresas/components/empresas-map.css` e `company-drawer.css`; tema dos controles do MapLibre em `src/features/empresas/map-theme.css`. O projeto não usa CSS Modules (a regra do Tailwind no Turbopack trata todo `.css` como global).

### Cadastro de empresa
- "Buscar pelo CNPJ" (botão secundário ao lado do CNPJ) preenche razão social, nome fantasia, CNAE e endereço pela BrasilAPI; nada é salvo sem o usuário revisar. Falha aparece como erro do campo CNPJ.
- CNAE com máscara `0000-0/00` (fonte mono, `tabular-nums`) e descrição.
- "Matriz ou filial": botões de rádio; filial pede a matriz (lista só empresas que não são filiais). Empresa com filiais não pode virar filial (opção desabilitada com explicação).
- "Localização no mapa": botão "Localizar no mapa" (CEP, depois endereço), campos de latitude/longitude e mapa pequeno com pino arrastável; clicar no mapa também move o pino.
- Lista de empresas: filiais aparecem recuadas sob a matriz, com selo "Matriz · N filiais" / "Filial"; ícone de "sem localização" quando faltam coordenadas.

### Estados vazios, carregando e erro
- Lista vazia: `EmptyState` com ícone do módulo, frase do que falta e a ação para criar ("Nenhuma missão neste quadro" + "Nova missão"). Se o usuário não pode criar, omita a ação e diga quem pode.
- Carregando: `loading.tsx` com esqueletos em `bg-surface-2 animate-pulse` no formato do conteúdo; `Spinner` só em ações pontuais.
- Erro: `Alert tone="danger"` com o que aconteceu e o que fazer; nunca mostre mensagens técnicas do banco.

### Texto
- Português do Brasil, frases curtas, sentença com inicial maiúscula ("Nova empresa", não "Nova Empresa").
- Valores em `R$` com `lib/format/money.ts`; números alinhados com `tabular-nums`.
