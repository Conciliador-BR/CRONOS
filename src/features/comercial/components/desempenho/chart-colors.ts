/**
 * Cores do gráfico de desempenho. O SVG do recharts precisa de valores literais:
 * `REVENUE` = token `primary`; `GOAL` = ciano da família do token `accent`, escurecido para ficar na
 * faixa de luminosidade validada no fundo `surface` (o `accent` puro é claro demais para marca de dados).
 * Validado com o validador de paleta (modo escuro, fundo #0b1020): contraste, CVD e visão normal ok.
 */
export const CHART_COLORS = {
  revenue: "#2563eb",
  goal: "#0891b2",
  grid: "#1e2a4a",
  axis: "#8a97b8",
  surface: "#0b1020",
  cursor: "#111a33",
} as const;
