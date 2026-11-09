import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Logo } from "@/components/ui/logo";
import { MagicDustBackground } from "@/components/ui/magic-dust-background";
import { needsSetup } from "../primeiro-acesso/needs-setup";
import { LoginForm } from "./login-form";
import { safeNextPath } from "./safe-next";

export const metadata: Metadata = { title: "Entrar" };

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [params, showSetup] = await Promise.all([searchParams, needsSetup()]);
  const rawNext = typeof params.next === "string" ? params.next : undefined;
  const next = rawNext ? safeNextPath(rawNext) : undefined;
  const inactive = params.erro === "inativo";
  const badLink = params.erro === "link";

  return (
    <div className="relative isolate grid min-h-dvh lg:grid-cols-[1fr_24rem]">
      {/* Painel visual: campo de partículas, só em telas largas. */}
      <aside className="relative isolate hidden overflow-hidden border-r border-border bg-bg lg:block">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(60%_50%_at_50%_40%,color-mix(in_srgb,var(--primary)_20%,transparent),transparent)]"
        />
        <MagicDustBackground className="absolute inset-0" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Link href="/" className="inline-flex rounded-md" aria-label="CRONOS: página inicial">
            <Logo />
          </Link>
          <p className="max-w-sm text-lg text-muted text-pretty">
            O tempo do seu time, organizado em um só lugar.
          </p>
        </div>
      </aside>

      {/* Painel do formulário. */}
      <div className="flex items-center justify-center bg-bg px-4 py-12">
        <main className="w-full max-w-sm">
          <Link href="/" className="mb-8 inline-flex rounded-md lg:hidden" aria-label="CRONOS: página inicial">
            <Logo />
          </Link>
          <h1 className="text-xl font-semibold text-balance">Entrar no CRONOS</h1>
          <p className="mt-1.5 text-sm text-muted text-pretty">
            Use o e-mail e a senha cadastrados pelo administrador.
          </p>
          <div className="mt-6">
            {inactive ? (
              <Alert tone="warning" className="mb-4">
                Seu acesso ainda não foi liberado pelo administrador.
              </Alert>
            ) : null}
            {badLink ? (
              <Alert tone="danger" className="mb-4">
                Link de confirmação inválido ou expirado. Tente entrar com sua senha.
              </Alert>
            ) : null}
            <LoginForm next={next} />
          </div>
          <div className="mt-6 text-sm text-muted">
            {showSetup ? (
              <>
                Primeira vez por aqui?{" "}
                <Link href="/primeiro-acesso" className="font-medium text-ring underline-offset-4 hover:underline">
                  Primeiro acesso do responsável
                </Link>
              </>
            ) : (
              <>Esqueceu a senha? Fale com o administrador do sistema.</>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
