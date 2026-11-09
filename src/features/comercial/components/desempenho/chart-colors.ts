/**
 * Cores do gráfico de desempenho. O SVG do recharts precisa de valores literais:
 * `REVENUE` = token `primary`; `GOAL` = ciano da família do token `accent`, escurecido para ficar na
 * faixa de luminosidade validada no fundo `surface` (o `accent` puro é claro demais para marca de dados).
 * Validado com o validador de paleta (modo escuro, fundo #13131b): contraste, CVD e visão normal ok.
 */
export const CHART_COLORS = {
  revenue: "#5b5ee8",
  goal: "#0891b2",
  /** Perdidos no gráfico ganhos x perdidos (par com `revenue` validado no fundo `surface`). */
  lost: "#ea580c",
  grid: "#303043",
  axis: "#9b9bb5",
  surface: "#13131b",
  cursor: "#1c1c28",
} as const;
