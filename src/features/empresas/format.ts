import { formatCnpj, onlyDigits } from "@/lib/format/document";

export function formatCep(value: string | null | undefined) {
  const d = onlyDigits(value ?? "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function formatCpf(value: string) {
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

/** CPF (até 11 dígitos) ou CNPJ (12 a 14 dígitos), formatado enquanto digita. */
export function formatCpfCnpj(value: string | null | undefined) {
  const d = onlyDigits(value ?? "");
  return d.length <= 11 ? formatCpf(d) : formatCnpj(d);
}

export const ACCOUNT_TYPE_LABELS = {
  corrente: "Conta corrente",
  poupanca: "Poupança",
  pagamento: "Conta de pagamento",
} as const;

export type AccountType = keyof typeof ACCOUNT_TYPE_LABELS;

export function accountTypeLabel(value: string | null) {
  return value && Object.hasOwn(ACCOUNT_TYPE_LABELS, value) ? ACCOUNT_TYPE_LABELS[value as AccountType] : "Tipo não informado";
}

const sizeFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${sizeFormat.format(bytes / 1024)} KB`;
  return `${sizeFormat.format(bytes / (1024 * 1024))} MB`;
}

/** Endereço em uma linha: "Rua X, 10 - Sala 2 · Centro · Cidade/UF · CEP 00000-000". */
export function formatAddress(a: {
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  uf: string;
  cep: string | null;
}) {
  const line1 = [a.street, a.number].filter(Boolean).join(", ");
  const line = [line1, a.complement].filter(Boolean).join(" - ");
  const place = a.city ? `${a.city}/${a.uf}` : a.uf;
  return [line, a.district, place, a.cep ? `CEP ${formatCep(a.cep)}` : null].filter(Boolean).join(" · ");
}
