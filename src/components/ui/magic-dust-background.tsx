"use client";

import { cn } from "@/lib/utils";
import type { SequenceItem } from "./magic-dust-geometry";
import { MagicDust } from "./magic-dust-shader";

/** Palavras e formas que o campo de partículas monta e desfaz em ciclo. */
const CRONOS_SEQUENCE: SequenceItem[] = [
  { type: "text", text: "CRONOS" },
  { type: "shape", shape: "sphere" },
  { type: "text", text: "MISSÕES" },
  { type: "shape", shape: "torus" },
  { type: "text", text: "COMERCIAL" },
  { type: "shape", shape: "box" },
  { type: "text", text: "AGENDA" },
];

/**
 * Preset do CRONOS para o `MagicDust`: camada decorativa com as palavras do produto
 * e cor da paleta. `className` define a cobertura: `fixed inset-0` (tela cheia, apresentação)
 * ou `absolute inset-0` (contido num painel, como a coluna do login). Decorativo e sem clique.
 */
export function MagicDustBackground({
  sequence = CRONOS_SEQUENCE,
  particleColor = "#818cf8",
  particleCount = 9000,
  holdDuration,
  className = "fixed inset-0",
}: {
  sequence?: SequenceItem[];
  particleColor?: string;
  particleCount?: number;
  /** Segundos que cada forma fica montada girando antes de explodir; com um item só vira o loop girar→explodir→reconstruir. */
  holdDuration?: number;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn("pointer-events-none -z-10", className)}>
      <MagicDust
        sequence={sequence}
        particleColor={particleColor}
        particleCount={particleCount}
        holdDuration={holdDuration}
      />
    </div>
  );
}
