"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import "./empresas-map.css";

export type CloudBurst = { key: number; kind: "full" | "light" };

/** Nuvens que entram das bordas (dx/dy) e passam pela câmera. Posições em % do mapa. */
const PUFFS = [
  { x: "18%", y: "22%", s: "70%", dx: "-60%", dy: "-50%", d: "0ms" },
  { x: "82%", y: "20%", s: "75%", dx: "60%", dy: "-55%", d: "40ms" },
  { x: "15%", y: "80%", s: "80%", dx: "-65%", dy: "55%", d: "70ms" },
  { x: "85%", y: "78%", s: "72%", dx: "60%", dy: "60%", d: "20ms" },
  { x: "50%", y: "8%", s: "65%", dx: "0%", dy: "-80%", d: "110ms" },
  { x: "50%", y: "95%", s: "68%", dx: "0%", dy: "80%", d: "90ms" },
  { x: "4%", y: "50%", s: "60%", dx: "-80%", dy: "0%", d: "130ms" },
  { x: "96%", y: "50%", s: "60%", dx: "80%", dy: "0%", d: "150ms" },
] as const;

const DURATION = { full: 1700, light: 950 } as const;

/**
 * Efeito "entrando numa nuvem" sobre o mapa. Só transform/opacity, sem eventos de ponteiro;
 * o pai não renderiza o efeito quando o usuário prefere menos movimento.
 */
export function CloudOverlay({ burst, onDone }: { burst: CloudBurst | null; onDone: () => void }) {
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);
  useEffect(() => {
    if (!burst) return;
    const timer = window.setTimeout(() => onDoneRef.current(), DURATION[burst.kind] + 250);
    return () => window.clearTimeout(timer);
  }, [burst]);

  if (!burst) return null;
  const puffs = burst.kind === "full" ? PUFFS : PUFFS.slice(0, 4);
  const duration = DURATION[burst.kind];
  return (
    <div
      key={burst.key}
      aria-hidden
      className={burst.kind === "light" ? "em-clouds em-light" : "em-clouds"}
      style={{ "--cloud-duration": `${duration}ms` } as CSSProperties}
    >
      <div className="em-veil" />
      {puffs.map((p, i) => (
        <div
          key={i}
          className="em-puff"
          style={{ "--x": p.x, "--y": p.y, "--s": p.s, "--dx": p.dx, "--dy": p.dy, "--d": p.d } as CSSProperties}
        />
      ))}
    </div>
  );
}
