"use client";

import { ArrowLeft, Building2, MapPinned, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { UF_NAMES, type Uf } from "../brazil-states";
import { companiesLabel, type CompanySummary } from "../map-utils";
import { MarketList } from "./market-list";

type PanelProps = {
  searching: boolean;
  results: CompanySummary[];
  selectedUf: Uf | null;
  stateCompanies: CompanySummary[];
  ranking: { uf: Uf; count: number }[];
  pendingId: string | null;
  activeId: string | null;
  parentNames: ReadonlyMap<string, string>;
  onOpen: (id: string) => void;
  onSelectUf: (uf: Uf) => void;
  onClearUf: () => void;
};

/** Painel ao lado do mapa: resultados da busca, mercados do estado ou ranking de estados. */
export function ExplorerPanel(props: PanelProps) {
  const { searching, results, selectedUf, stateCompanies, ranking, pendingId, activeId, parentNames, onOpen } = props;
  const list = { pendingId, activeId, onOpen, parentNames };

  if (searching) {
    return (
      <Card>
        <CardHeader>
          <CardTitle as="h2">Resultados da busca</CardTitle>
          <p className="text-sm text-muted">{companiesLabel(results.length)}</p>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <EmptyState icon={SearchX} title="Nada encontrado" description="Tente outro nome, cidade, CNPJ ou cliente." />
          ) : (
            <MarketList companies={results} withUf {...list} />
          )}
        </CardContent>
      </Card>
    );
  }

  if (selectedUf) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle as="h2">{UF_NAMES[selectedUf]}</CardTitle>
              <p className="text-sm text-muted">Mercados atendidos · {companiesLabel(stateCompanies.length)}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={props.onClearUf}>
              <ArrowLeft aria-hidden />
              Brasil
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stateCompanies.length === 0 ? (
            <EmptyState
              icon={MapPinned}
              title="Nenhum mercado neste estado"
              description="Empresas cadastradas em Configurações aparecem aqui."
            />
          ) : (
            <MarketList companies={stateCompanies} {...list} />
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Estados atendidos</CardTitle>
        <p className="text-sm text-muted">Clique num estado no mapa ou na lista para entrar nele.</p>
      </CardHeader>
      <CardContent>
        {ranking.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Nenhuma empresa cadastrada"
            description="Administradores e gestores cadastram empresas em Configurações → Empresas."
          />
        ) : (
          <ul className="flex flex-col gap-1">
            {ranking.map(({ uf, count }) => (
              <li key={uf}>
                <button
                  type="button"
                  onClick={() => props.onSelectUf(uf)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2"
                >
                  <span className="text-fg">{UF_NAMES[uf]}</span>
                  <span className="text-muted tabular-nums">{companiesLabel(count)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
