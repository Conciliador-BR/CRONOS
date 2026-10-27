import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { needsSetup } from "../primeiro-acesso/needs-setup";
import { AuthShell } from "./auth-shell";
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
    <AuthShell
      title="Entrar no CRONOS"
      description="Use o e-mail e a senha cadastrados pelo administrador."
      footer={
        showSetup ? (
          <>
            Primeira vez por aqui?{" "}
            <Link href="/primeiro-acesso" className="font-medium text-ring underline-offset-4 hover:underline">
              Primeiro acesso do responsável
            </Link>
          </>
        ) : (
          <>Esqueceu a senha? Fale com o administrador do sistema.</>
        )
      }
    >
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
    </AuthShell>
  );
}
