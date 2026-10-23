import type { ReactNode } from "react";
import { ShellProvider } from "./shell-context";
import { Sidebar } from "./sidebar";
import { TopBar, type ShellUser } from "./top-bar";

/**
 * Estrutura das páginas logadas: menu lateral + barra superior + conteúdo.
 * Recebe só dados serializáveis do usuário (nada de perfil completo no cliente).
 */
export function AppShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  return (
    <ShellProvider>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-fg"
      >
        Pular para o conteúdo
      </a>
      <div className="flex min-h-dvh w-full bg-bg text-fg">
        <Sidebar role={user.role} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar user={user} />
          <main id="conteudo" tabIndex={-1} className="flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </ShellProvider>
  );
}
