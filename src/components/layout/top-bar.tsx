import { LogOut } from "lucide-react";
import { Suspense } from "react";
import { ReminderCenter } from "@/features/lembretes/components/reminder-center";
import type { Reminder } from "@/features/lembretes/reminders";
import { ROLE_LABELS, getInitials, type AppRole } from "@/lib/nav";
import { MobileMenuButton } from "./mobile-menu-button";

export type ShellUser = { name: string; email: string; role: AppRole };

/** Barra superior: botão do menu (celular), lembretes, usuário, papel e sair. Server Component. */
export function TopBar({ user, reminders }: { user: ShellUser; reminders: Promise<Reminder[]> }) {
  const displayName = user.name.trim() || user.email;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-bg/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-bg/70 sm:px-6">
      <MobileMenuButton />
      <div className="ml-auto flex min-w-0 items-center gap-3">
        {/* Os lembretes chegam depois, sem segurar o resto da página. */}
        <Suspense fallback={<span aria-hidden className="size-9 shrink-0 rounded-md border border-border" />}>
          <ReminderCenter reminders={reminders} />
        </Suspense>
        <div className="hidden min-w-0 text-right sm:block">
          <p className="truncate text-sm font-medium text-fg">{displayName}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
        </div>
        <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-medium text-accent">
          {ROLE_LABELS[user.role]}
        </span>
        <span
          aria-hidden
          title={displayName}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-3 text-sm font-semibold text-fg ring-1 ring-border"
        >
          {getInitials(displayName)}
        </span>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:border-danger/50 hover:text-fg"
          >
            <LogOut aria-hidden className="size-4" />
            <span>Sair</span>
          </button>
        </form>
      </div>
    </header>
  );
}
