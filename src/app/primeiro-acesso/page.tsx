import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "../login/auth-shell";
import { needsSetup } from "./needs-setup";
import { SetupClosed, SetupForm } from "./setup-form";

export const metadata: Metadata = { title: "Primeiro acesso" };

export default async function FirstAccessPage() {
  const open = await needsSetup();

  return (
    <AuthShell
      title="Primeiro acesso"
      description={
        open
          ? "Use o e-mail autorizado do responsável pelo CRONOS. Depois de confirmar o e-mail, essa conta vira administradora. Outros cadastros ficam aguardando liberação."
          : undefined
      }
      footer={
        open ? (
          <>
            Já tem conta?{" "}
            <Link href="/login" className="font-medium text-ring underline-offset-4 hover:underline">
              Entrar
            </Link>
          </>
        ) : undefined
      }
    >
      {open ? <SetupForm /> : <SetupClosed />}
    </AuthShell>
  );
}
