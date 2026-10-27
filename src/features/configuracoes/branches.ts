/** Item mínimo para agrupar matriz → filiais. */
type Branchable = { id: string; parentId: string | null };

export type BranchGroup<T> = { company: T; branches: T[] };

/**
 * Agrupa as filiais sob a matriz, mantendo a ordem original da lista.
 * Filial cuja matriz não está na lista vira um grupo próprio (com `orphan`).
 */
export function groupBranches<T extends Branchable>(companies: readonly T[]) {
  const ids = new Set(companies.map((c) => c.id));
  const branchesOf = new Map<string, T[]>();
  for (const c of companies) {
    if (!c.parentId || !ids.has(c.parentId)) continue;
    const list = branchesOf.get(c.parentId);
    if (list) list.push(c);
    else branchesOf.set(c.parentId, [c]);
  }
  const groups: (BranchGroup<T> & { orphan: boolean })[] = [];
  for (const c of companies) {
    if (c.parentId && ids.has(c.parentId)) continue; // aparece dentro da matriz
    groups.push({ company: c, branches: branchesOf.get(c.id) ?? [], orphan: c.parentId !== null });
  }
  return groups;
}
