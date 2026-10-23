import { cn } from "@/lib/utils";

/** Barra horizontal simples para fatias (0–1). O número sempre aparece ao lado, em texto. */
export function ShareBar({ ratio, className, tone = "primary" }: { ratio: number; className?: string; tone?: "primary" | "success" }) {
  const width = Math.max(0, Math.min(100, Math.round(ratio * 100)));
  return (
    <div aria-hidden className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-3", className)}>
      <div className={cn("h-full rounded-full", tone === "success" ? "bg-success" : "bg-primary")} style={{ width: `${width}%` }} />
    </div>
  );
}
