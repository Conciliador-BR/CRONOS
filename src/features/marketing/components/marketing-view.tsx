import Link from "next/link";
import { Megaphone } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCents } from "@/lib/format/money";
import { formatPercent, leadsPerMonth, summarize, type MarketingLead } from "../metrics";

const STAGE: Record<string, { label: string; variant: BadgeVariant }> = {
  lead_recebido: { label: "Lead recebido", variant: "neutral" },
  diagnostico_feito: { label: "Diagnóstico feito", variant: "primary" },
  reuniao_marcada: { label: "Reunião marcada", variant: "primary" },
  follow_up: { label: "Follow up", variant: "warning" },
  cliente_fechado: { label: "Cliente fechado", variant: "success" },
  cliente_perdido: { label: "Cliente perdido", variant: "danger" },
};

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" });

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-2xl font-semibold text-fg tabular-nums">{value}</dd>
      {hint ? <dd className="text-xs text-muted">{hint}</dd> : null}
    </div>
  );
}

type Props = {
  leads: MarketingLead[];
  now: Date;
  /** Nomes atuais das etapas do CRM (renomeáveis por gestores); sem eles, valem os padrões acima. */
  stageLabels?: Partial<Record<string, string>>;
};

export function MarketingView({ leads, now, stageLabels }: Props) {
  const notice = (
    <Alert tone="info" title="Página em evolução">
      Defina com o time o que acompanhar aqui. Por enquanto: leads com origem “marketing” do pipeline comercial.
    </Alert>
  );
  if (leads.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {notice}
        <EmptyState
          icon={Megaphone}
          title="Nenhum lead de marketing ainda"
          description="Leads cadastrados no CRM com origem “Marketing” aparecem aqui."
          action={
            <Link href="/comercial/crm" className={buttonVariants({ variant: "secondary" })}>
              Abrir o CRM
            </Link>
          }
        />
      </div>
    );
  }

  const s = summarize(leads);
  const months = leadsPerMonth(leads, now);
  const peak = Math.max(1, ...months.map((m) => m.count));
  const hotShare = s.total ? s.hot / s.total : 0;

  return (
    <div className="flex flex-col gap-6">
      {notice}
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Leads de marketing" value={String(s.total)} hint={`${s.open} em andamento`} />
        <Stat label="Taxa de conversão" value={formatPercent(s.conversionRate)} hint={`${s.won} fechados · ${s.lost} perdidos`} />
        <Stat label="Faturamento fechado" value={formatCents(s.revenueCents)} />
        <Stat label="Quentes x frios" value={`${s.hot} / ${s.cold}`} hint={`${formatPercent(hotShare)} quentes`} />
      </dl>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Leads por mês</CardTitle>
            <CardDescription>Últimos 6 meses, pela data de entrada no CRM.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="flex h-48 items-end gap-2 sm:gap-4" aria-label="Leads de marketing por mês">
              {months.map((m) => (
                <li key={m.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="sr-only">
                    {m.label}: {m.count} {m.count === 1 ? "lead" : "leads"}
                  </span>
                  <span aria-hidden className="text-xs font-medium text-fg tabular-nums">
                    {m.count}
                  </span>
                  <span
                    aria-hidden
                    className="w-full max-w-12 rounded-t-md bg-primary"
                    style={{ height: `${Math.max(m.count ? 4 : 1, (m.count / peak) * 100)}%`, opacity: m.count ? 1 : 0.35 }}
                  />
                  <span aria-hidden className="text-xs text-muted">
                    {m.label}
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Temperatura</CardTitle>
            <CardDescription>Como os leads chegam classificados.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex h-3 overflow-hidden rounded-full bg-surface-2" aria-hidden>
              <span className="bg-warning" style={{ width: `${hotShare * 100}%` }} />
              <span className="flex-1 bg-ring/60" />
            </div>
            <ul className="flex flex-col gap-2 text-sm">
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-fg">
                  <span aria-hidden className="size-2.5 rounded-full bg-warning" /> Quentes
                </span>
                <span className="text-muted tabular-nums">{s.hot}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-fg">
                  <span aria-hidden className="size-2.5 rounded-full bg-ring/60" /> Frios
                </span>
                <span className="text-muted tabular-nums">{s.cold}</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle as="h2">Últimos leads de marketing</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {leads.slice(0, 10).map((l) => {
              const fallback = STAGE[l.stage] ?? { label: l.stage, variant: "neutral" as const };
              const stage = { ...fallback, label: stageLabels?.[l.stage] ?? fallback.label };
              return (
                <li key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="truncate text-sm font-medium text-fg">{l.name}</p>
                    <p className="truncate text-xs text-muted">{l.companyName ?? "Empresa não informada"}</p>
                  </div>
                  <Badge variant={l.temperature === "quente" ? "warning" : "neutral"}>
                    {l.temperature === "quente" ? "Quente" : "Frio"}
                  </Badge>
                  <Badge variant={stage.variant}>{stage.label}</Badge>
                  <span className="w-20 text-right text-xs text-muted tabular-nums">{dateFormat.format(new Date(l.createdAt))}</span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
