import { Badge } from "@/components/ui/badge";
import type { PropertyOption } from "../types";

/** Pílula colorida com bolinha (Selecionar, Seleção múltipla e Status). */
export function OptionPill({ option, className }: { option: PropertyOption; className?: string }) {
  return (
    <Badge color={option.color} dot className={className}>
      {option.name}
    </Badge>
  );
}
