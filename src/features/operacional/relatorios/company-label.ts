/**
 * Número da unidade: matriz = 1; filial = `branch_number` do cadastro ou, sem ele,
 * a ordem do CNPJ (dígitos 9 a 12: /0003 = filial 03). Null se não der para saber.
 */
export function branchOrder(parentId: string | null, branchNumber: number | null, cnpj: string): number | null {
  if (!parentId) return 1;
  if (branchNumber) return branchNumber;
  const order = Number(cnpj.replace(/\D/g, "").slice(8, 12));
  return order >= 2 ? order : null;
}

/** "Matriz", "Filial 02" ou só "Filial". */
export function branchLabel(order: number | null): string {
  if (order === 1) return "Matriz";
  return order ? `Filial ${String(order).padStart(2, "0")}` : "Filial";
}
