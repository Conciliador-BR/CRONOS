import type { ComponentProps, CSSProperties } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "danger";

const variants: Record<BadgeVariant, string> = {
  neutral: "border-border bg-surface-2 text-muted",
  primary: "border-primary/40 bg-primary/15 text-ring",
  success: "border-success/40 bg-success/15 text-success",
  warning: "border-warning/40 bg-warning/15 text-warning",
  danger: "border-danger/40 bg-danger/15 text-danger",
};

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export type BadgeProps = ComponentProps<"span"> & {
  variant?: BadgeVariant;
  /** Cor livre em hex (#rgb ou #rrggbb), ex.: etiquetas. Sobrepõe a variante. */
  color?: string;
  /** Mostra uma bolinha da cor antes do texto. */
  dot?: boolean;
};

export function Badge({ variant = "neutral", color, dot, className, style, children, ...props }: BadgeProps) {
  const custom = color && HEX.test(color) ? color : undefined;
  // Texto clareado com branco para manter contraste no fundo escuro.
  const customStyle: CSSProperties | undefined = custom
    ? {
        backgroundColor: `color-mix(in srgb, ${custom} 18%, transparent)`,
        borderColor: `color-mix(in srgb, ${custom} 45%, transparent)`,
        color: `color-mix(in srgb, ${custom} 55%, white)`,
      }
    : undefined;

  return (
    <span
      className={cn(
        "inline-flex h-6 max-w-full items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium",
        custom ? null : variants[variant],
        className,
      )}
      style={{ ...customStyle, ...style }}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden
          className="size-1.5 shrink-0 rounded-full bg-current"
          style={custom ? { backgroundColor: custom } : undefined}
        />
      ) : null}
      <span className="truncate">{children}</span>
    </span>
  );
}
