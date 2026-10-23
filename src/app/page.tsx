import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Building2,
  Calendar,
  ChartLine,
  FileText,
  GraduationCap,
  Kanban,
  LogIn,
  Megaphone,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { Logo } from "@/components/ui/logo";

const pillars: { icon: LucideIcon; label: string }[] = [
  { icon: Kanban, label: "Tarefas em quadros" },
  { icon: Calendar, label: "Agenda de reuniões" },
  { icon: FileText, label: "Documentação" },
  { icon: GraduationCap, label: "Cursos internos" },
  { icon: ChartLine, label: "Pipeline comercial" },
];

const modules: { icon: LucideIcon; name: string; summary: string; items: string[] }[] = [
  {
    icon: Building2,
    name: "Empresas",
    summary: "Onde estão seus clientes, em um mapa do Brasil.",
    items: ["Estados em destaque por volume", "Mercados atendidos por estado", "Ficha completa do cliente"],
  },
  {
    icon: Kanban,
    name: "Operacional",
    summary: "O dia a dia do time, sem planilhas soltas.",
    items: ["Missões em quadros e listas", "Agenda mês, semana e dia", "Documentações de API e cursos"],
  },
  {
    icon: ChartLine,
    name: "Comercial",
    summary: "Do primeiro contato ao contrato fechado.",
    items: ["Pipeline com arrastar e soltar", "Ranking, metas e comissões", "Insights de origem e perdas"],
  },
  {
    icon: Megaphone,
    name: "Marketing",
    summary: "Quanto o marketing gera e quanto vira venda.",
    items: ["Leads por mês", "Conversão por origem", "Quentes x frios"],
  },
  {
    icon: Settings,
    name: "Configurações",
    summary: "Cadastros e acessos sob controle do administrador.",
    items: ["Empresas, clientes e contas", "Funcionários, times e papéis", "Liberação de logins"],
  },
];

const board = [
  { title: "Lead recebido", cards: [{ t: "Mercado Bom Preço", tag: "Indicação" }, { t: "Rede Central", tag: "Marketing" }] },
  { title: "Reunião marcada", cards: [{ t: "Atacadão Sul", tag: "Quente" }] },
  { title: "Cliente fechado", cards: [{ t: "Super Norte", tag: "R$ 12.400" }] },
];

export default function LandingPage() {
  return (
    <div className="relative isolate flex flex-1 flex-col overflow-x-clip">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] bg-[radial-gradient(55%_60%_at_50%_0%,color-mix(in_srgb,var(--primary)_28%,transparent),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:48px_48px] opacity-30 [mask-image:radial-gradient(60%_55%_at_50%_0%,black,transparent)]"
      />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="rounded-md" aria-label="CRONOS: página inicial">
          <Logo />
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-1 sm:gap-2">
          <a href="#modulos" className={buttonVariants({ variant: "ghost", className: "hidden sm:inline-flex" })}>
            Módulos
          </a>
          <Link href="/login" className={buttonVariants({ variant: "secondary" })}>
            <LogIn aria-hidden />
            Entrar
          </Link>
        </nav>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-10 pb-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
          <div className="flex flex-col items-start gap-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-ring">
              <span aria-hidden className="size-1.5 rounded-full bg-accent" />
              CRM interno da equipe
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              O tempo do seu time, <span className="text-primary">organizado</span> em um só lugar.
            </h1>
            <p className="max-w-xl text-lg text-muted text-pretty">
              O CRONOS une gestão de tarefas no estilo Trello, agenda de reuniões, documentação, cursos e pipeline
              comercial. Menos abas abertas, mais clientes atendidos.
            </p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link href="/login" className={buttonVariants({ size: "lg" })}>
                Entrar no CRONOS
                <ArrowRight aria-hidden />
              </Link>
              <a href="#modulos" className={buttonVariants({ variant: "secondary", size: "lg" })}>
                Conhecer os módulos
              </a>
            </div>
            <ul className="mt-2 flex flex-wrap gap-2" aria-label="O que o CRONOS reúne">
              {pillars.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/70 px-2.5 py-1 text-xs text-muted"
                >
                  <Icon aria-hidden className="size-3.5 text-ring" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <BoardPreview />
        </section>

        <section id="modulos" aria-labelledby="modulos-titulo" className="scroll-mt-8 border-t border-border bg-surface/40">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-ring">Módulos</p>
              <h2 id="modulos-titulo" className="mt-2 text-3xl font-semibold tracking-tight text-balance">
                Cada área da empresa com sua tela, todas falando a mesma língua.
              </h2>
              <p className="mt-3 text-muted text-pretty">
                O pipeline alimenta o desempenho, o desempenho alimenta os insights. Nada é digitado duas vezes.
              </p>
            </div>
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map(({ icon: Icon, name, summary, items }) => (
                <li
                  key={name}
                  className="group flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 transition-colors hover:border-primary/50"
                >
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-ring ring-1 ring-primary/30">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">{name}</h3>
                    <p className="mt-1 text-sm text-muted text-pretty">{summary}</p>
                  </div>
                  <ul className="mt-auto flex flex-col gap-1.5 text-sm">
                    {items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
              <li className="flex flex-col justify-between gap-6 rounded-xl border border-primary/40 bg-linear-to-br from-primary/20 to-surface p-6">
                <div>
                  <h3 className="text-lg font-semibold">Acesso por papéis</h3>
                  <p className="mt-1 text-sm text-muted text-pretty">
                    Administrador, gestor e funcionário veem só o que precisam. Dados bancários e documentos ficam
                    restritos.
                  </p>
                </div>
                <div className="flex gap-3 text-ring">
                  <ShieldCheck aria-hidden className="size-5" />
                  <Users aria-hidden className="size-5" />
                  <BookOpen aria-hidden className="size-5" />
                </div>
              </li>
            </ul>
          </div>
        </section>

        <section aria-labelledby="cta-titulo" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-col items-start gap-6 rounded-2xl border border-border bg-surface p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div>
              <h2 id="cta-titulo" className="text-2xl font-semibold tracking-tight text-balance">
                Pronto para começar o dia?
              </h2>
              <p className="mt-1 text-muted">Entre com o acesso criado pelo administrador.</p>
            </div>
            <Link href="/login" className={buttonVariants({ size: "lg", className: "w-full sm:w-auto" })}>
              Entrar
              <ArrowRight aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:flex-row sm:px-6">
          <Logo variant="mark" className="size-6" />
          <p>CRONOS · uso interno</p>
        </div>
      </footer>
    </div>
  );
}

/** Prévia decorativa de um quadro do pipeline (sem imagens externas). */
function BoardPreview() {
  return (
    <div aria-hidden className="relative">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-primary/10 blur-2xl" />
      <div className="rounded-2xl border border-border bg-surface/90 p-4 shadow-2xl shadow-black/60 backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-surface-3" />
            <span className="size-2.5 rounded-full bg-surface-3" />
            <span className="size-2.5 rounded-full bg-surface-3" />
          </div>
          <span className="text-xs text-muted">Pipeline · Outubro</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {board.map((col, i) => (
            <div key={col.title} className="flex min-w-0 flex-col gap-2 rounded-lg bg-surface-2/70 p-2">
              <p className="truncate px-1 text-[11px] font-medium text-muted">{col.title}</p>
              {col.cards.map((card) => (
                <div
                  key={card.t}
                  className={
                    "rounded-md border bg-surface p-2.5 " +
                    (i === 2 ? "border-primary/50 shadow-md shadow-primary/20" : "border-border")
                  }
                >
                  <p className="truncate text-xs font-medium">{card.t}</p>
                  <span
                    className={
                      "mt-2 inline-block rounded px-1.5 py-0.5 text-[10px] " +
                      (i === 2 ? "bg-success/15 text-success" : "bg-primary/15 text-ring")
                    }
                  >
                    {card.tag}
                  </span>
                </div>
              ))}
              <div className="h-8 rounded-md border border-dashed border-border" />
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            ["Faturamento", "R$ 84,2 mil"],
            ["Conversão", "31%"],
            ["Reuniões hoje", "6"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-border bg-surface-2/50 p-3">
              <p className="truncate text-[11px] text-muted">{label}</p>
              <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
