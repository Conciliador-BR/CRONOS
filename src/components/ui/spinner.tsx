import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type SpinnerProps = {
  className?: string;
  /** Texto para leitores de tela. Omita quando o contexto já anuncia o carregamento. */
  label?: string;
};

export function Spinner({ className, label }: SpinnerProps) {
  return (
    <span role={label ? "status" : undefined} className="inline-flex">
      <LoaderCircle aria-hidden className={cn("size-4 animate-spin", className)} />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}
