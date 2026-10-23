import type { ComponentType, ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";

export type EmptyStateProps = {
  /** Ícone lucide (componente, não elemento): icon={Inbox}. */
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  title: ReactNode;
  description?: ReactNode;
  /** Ação principal, ex.: <Button>Nova missão</Button>. */
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-12 text-center",
        className,
      )}
    >
      {Icon ? (
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-ring ring-1 ring-primary/25">
          <Icon aria-hidden className="size-5" />
        </span>
      ) : null}
      <div className="flex max-w-sm flex-col gap-1">
        <p className="text-base font-semibold text-fg text-balance">{title}</p>
        {description ? <p className="text-sm text-muted text-pretty">{description}</p> : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
