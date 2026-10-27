import type { Uf } from "./brazil-states";

/** [oeste, sul, leste, norte] em graus (WGS 84). */
export type Bounds = readonly [number, number, number, number];
export type LngLat = readonly [number, number];

/**
 * Caixa e ponto central de cada UF, calculados de `public/geo/br-uf.json`
 * (malha estadual do IBGE simplificada; centro = centroide do maior polígono).
 * Ficam no código para o voo até o estado não depender do GeoJSON carregado.
 */
export const UF_GEO: Record<Uf, { bounds: Bounds; center: LngLat }> = {
  AC: { bounds: [-73.991, -11.145, -66.62, -7.112], center: [-70.471, -9.215] },
  AL: { bounds: [-38.238, -10.5, -35.155, -8.813], center: [-36.623, -9.515] },
  AM: { bounds: [-73.801, -9.818, -56.099, 2.244], center: [-64.653, -4.154] },
  AP: { bounds: [-54.876, -1.234, -49.876, 4.437], center: [-51.956, 1.443] },
  BA: { bounds: [-46.617, -18.333, -37.403, -8.538], center: [-41.722, -12.475] },
  CE: { bounds: [-41.401, -7.846, -37.253, -2.784], center: [-39.616, -5.092] },
  DF: { bounds: [-48.287, -16.052, -47.309, -15.5], center: [-47.797, -15.781] },
  ES: { bounds: [-41.875, -21.3, -39.666, -17.892], center: [-40.67, -19.574] },
  GO: { bounds: [-53.251, -19.499, -45.907, -12.396], center: [-49.624, -16.043] },
  MA: { bounds: [-48.755, -10.259, -41.797, -1.047], center: [-45.279, -5.06] },
  MG: { bounds: [-51.046, -22.904, -39.857, -14.237], center: [-44.673, -18.456] },
  MS: { bounds: [-58.166, -24.068, -50.923, -17.167], center: [-54.845, -20.327] },
  MT: { bounds: [-61.633, -18.042, -50.225, -7.349], center: [-55.913, -12.949] },
  PA: { bounds: [-58.895, -9.841, -46.073, 2.591], center: [-53.064, -3.975] },
  PB: { bounds: [-38.765, -8.303, -34.794, -6.028], center: [-36.835, -7.121] },
  PE: { bounds: [-41.358, -9.483, -34.808, -7.274], center: [-37.998, -8.326] },
  PI: { bounds: [-45.994, -10.929, -40.371, -2.739], center: [-42.968, -7.388] },
  PR: { bounds: [-54.62, -26.711, -48.082, -22.52], center: [-51.617, -24.636] },
  RJ: { bounds: [-44.876, -23.363, -40.965, -20.766], center: [-42.649, -22.188] },
  RN: { bounds: [-38.579, -6.983, -34.969, -4.832], center: [-36.673, -5.839] },
  RO: { bounds: [-66.806, -13.687, -59.793, -7.969], center: [-62.843, -10.912] },
  RR: { bounds: [-64.821, -1.581, -58.895, 5.272], center: [-61.399, 2.084] },
  RS: { bounds: [-57.566, -33.746, -49.694, -27.094], center: [-53.321, -29.707] },
  SC: { bounds: [-53.804, -29.35, -48.372, -25.956], center: [-50.474, -27.248] },
  SE: { bounds: [-38.245, -11.569, -36.394, -9.515], center: [-37.444, -10.584] },
  SP: { bounds: [-53.11, -25.31, -44.162, -19.781], center: [-48.735, -22.264] },
  TO: { bounds: [-50.742, -13.468, -45.698, -5.172], center: [-48.33, -10.15] },
};

/** Brasil inteiro (vista inicial). */
export const BRAZIL_BOUNDS: Bounds = [-74.1, -33.8, -34.7, 5.3];
/** Limite de navegação: um pouco além do território para caber as ilhas e o respiro da tela. */
export const MAX_BOUNDS: Bounds = [-90, -42, -20, 13];
