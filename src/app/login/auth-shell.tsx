import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/logo";

type AuthShellProps = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

/** Moldura das telas públicas de autenticação (login, primeiro acesso). */
export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="relative isolate flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_srgb,var(--primary)_22%,transparent),transparent)]"
      />
      <Link href="/" className="mb-8 rounded-md" aria-label="CRONOS: página inicial">
        <Logo />
      </Link>
      <main className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-surface/80 p-6 shadow-2xl shadow-black/50 backdrop-blur sm:p-8">
          <h1 className="text-xl font-semibold text-balance">{title}</h1>
          {description ? <p className="mt-1.5 text-sm text-muted text-pretty">{description}</p> : null}
          <div className="mt-6">{children}</div>
        </div>
        {footer ? <div className="mt-6 text-center text-sm text-muted">{footer}</div> : null}
      </main>
    </div>
  );
}
