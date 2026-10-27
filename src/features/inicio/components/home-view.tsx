import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CalendarClock,
  ListChecks,
  MapPinned,
  Megaphone,
  Settings,
  TrendingUp,
  UserRoundSearch,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HomeSummary } from "../queries";

type Shortcut = { href: string; label: string; description: string; icon: LucideIcon; managerOnly?: true };

const SHORTCUTS: Shortcut[] = [
  { href: "/empresas", label: "Empresas", description: "Mapa dos estados atendidos e dados dos clientes.", icon: Building2 },
  { href: "/operacional", label: "Operacional", description: "Missões, agenda, documentações e cursos.", icon: Briefcase },
  { href: "/comercial", label: "Comercial", description: "Pipeline, desempenho e insights de vendas.", icon: TrendingUp },
  { href: "/marketing", label: "Marketing", description: "Leads que chegaram pelo marketing.", icon: Megaphone },
  { href: "/configuracoes", label: "Configurações", description: "Empresas, clientes, funcionários e times.", icon: Settings, managerOnly: true },
];

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});
const dateOnly = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" });

function Tile({ label, value, icon: Icon, href, unavailable }: { label: string; value: number; icon: LucideIcon; href: string; unavailable?: boolean }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-4 transition-colors hover:border-surface-3 hover:bg-surface-2"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-ring">
        <Icon aria-hidden className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-2xl leading-tight font-semibold text-fg tabular-nums">{unavailable ? "—" : value}</span>
        <span className="block truncate text-xs text-muted">{unavailable ? `${label} (indisponível)` : label}</span>
      </span>
    </Link>
  );
}

export function HomeView({ summary, manager }: { summary: HomeSummary; manager: boolean }) {
  const shortcuts = SHORTCUTS.filter((s) => manager || !s.managerOnly);
  const { failed } = summary;

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="resumo-titulo">
        <h2 id="resumo-titulo" className="sr-only">
          Resumo
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Tile label="Empresas cadastradas" value={summary.companies} icon={Building2} href="/empresas" unavailable={failed.companies} />
          <Tile label="Estados atendidos" value={summary.states} icon={MapPinned} href="/empresas" unavailable={failed.companies} />
          <Tile label="Leads abertos" value={summary.openLeads} icon={UserRoundSearch} href="/comercial/crm" unavailable={failed.leads} />
          <Tile label="Reuniões nos próximos 7 dias" value={summary.upcomingWeekCount} icon={CalendarClock} href="/operacional/agenda" unavailable={failed.events} />
          <Tile label="Minhas missões abertas" value={summary.myCardsCount} icon={ListChecks} href="/operacional/missoes" unavailable={failed.cards} />
        </div>
      </section>

      <section aria-labelledby="atalhos-titulo" className="flex flex-col gap-3">
        <h2 id="atalhos-titulo" className="text-base font-semibold text-fg">
          Acesso rápido
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shortcuts.map(({ href, label, description, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="group flex h-full items-start gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/50 hover:bg-surface-2"
              >
                <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-ring" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-fg">{label}</span>
                  <span className="block text-sm text-muted">{description}</span>
                </span>
                <ArrowRight aria-hidden className="mt-0.5 size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Próximas reuniões</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted">
                {failed.events ? "Não foi possível carregar a agenda agora." : "Nenhuma reunião marcada para você."}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {summary.upcomingEvents.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-2 text-sm">
                    <span className="min-w-0 truncate text-fg">{e.title}</span>
                    <span className="shrink-0 text-xs text-muted tabular-nums">
                      {(e.allDay ? dateOnly : dateTime).format(new Date(e.startsAt))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle as="h2">Minhas missões</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.myCards.length === 0 ? (
              <p className="text-sm text-muted">
                {failed.cards ? "Não foi possível carregar as missões agora." : "Nenhuma missão aberta atribuída a você."}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {summary.myCards.map((c) => {
                  const late = c.dueAt !== null && new Date(c.dueAt).getTime() < summary.now;
                  return (
                    <li key={c.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-2 text-sm">
                      <span className="min-w-0 truncate text-fg">{c.title}</span>
                      <span className={late ? "shrink-0 text-xs font-medium text-warning" : "shrink-0 text-xs text-muted"}>
                        {c.dueAt ? `${late ? "Atrasada · " : ""}${dateOnly.format(new Date(c.dueAt))}` : "Sem prazo"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
