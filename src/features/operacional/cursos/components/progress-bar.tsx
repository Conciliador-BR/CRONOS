import { cn } from "@/lib/utils";

export function ProgressBar({ percent, label, className }: { percent: number; label: string; className?: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-1.5 overflow-hidden rounded-full bg-surface-3", className)}
    >
      <div className={cn("h-full rounded-full transition-all", percent === 100 ? "bg-success" : "bg-primary")} style={{ width: `${percent}%` }} />
    </div>
  );
}
