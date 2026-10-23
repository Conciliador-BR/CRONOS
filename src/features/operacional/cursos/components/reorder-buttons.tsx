"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReorderButtons({
  label,
  index,
  count,
  disabled,
  onMove,
}: {
  label: string;
  index: number;
  count: number;
  disabled?: boolean;
  onMove: (direction: -1 | 1) => void;
}) {
  return (
    <span className="flex">
      <Button variant="ghost" size="sm" className="size-8 px-0" aria-label={`Subir ${label}`} disabled={disabled || index === 0} onClick={() => onMove(-1)}>
        <ArrowUp aria-hidden />
      </Button>
      <Button variant="ghost" size="sm" className="size-8 px-0" aria-label={`Descer ${label}`} disabled={disabled || index === count - 1} onClick={() => onMove(1)}>
        <ArrowDown aria-hidden />
      </Button>
    </span>
  );
}
