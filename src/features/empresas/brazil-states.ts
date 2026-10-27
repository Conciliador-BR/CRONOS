/** Unidades federativas aceitas pelo banco (companies.uf). */
export const UF_NAMES = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
} as const;

export type Uf = keyof typeof UF_NAMES;

export const UFS = Object.keys(UF_NAMES).sort() as Uf[];

export function isUf(value: string): value is Uf {
  return Object.hasOwn(UF_NAMES, value);
}

/** Converte texto livre ("sp", " SP ") na UF ("SP"); null se não reconhecer. */
export function toUf(value: string | null | undefined): Uf | null {
  const upper = (value ?? "").trim().toUpperCase();
  return isUf(upper) ? upper : null;
}
