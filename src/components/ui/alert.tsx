import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  info: { box: "border-primary/40 bg-primary/10 text-fg", icon: Info, iconClass: "text-ring" },
  success: { box: "border-success/40 bg-success/10 text-fg", icon: CircleCheck, iconClass: "text-success" },
  warning: { box: "border-warning/40 bg-warning/10 text-fg", icon: TriangleAlert, iconClass: "text-warning" },
  danger: { box: "border-danger/40 bg-danger/10 text-fg", icon: CircleAlert, iconClass: "text-danger" },
} as const;

export type AlertProps = {
  tone?: keyof typeof tones;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
};

/** Mensagem em bloco. danger/warning usam role="alert"; os demais, role="status". */
export function Alert({ tone = "info", title, children, className }: AlertProps) {
  const { box, icon: Icon, iconClass } = tones[tone];
  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-lg border px-4 py-3 text-sm", box, className)}
    >
      <Icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", iconClass)} />
      <div className="flex flex-col gap-0.5">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className="text-muted">{children}</div> : null}
      </div>
    </div>
  );
}
