"use client";

import { useSyncExternalStore } from "react";
import { wallParts } from "../../shared/tz";

function subscribe(callback: () => void) {
  const timer = setInterval(callback, 30_000);
  return () => clearInterval(timer);
}

const minuteNow = () => Math.floor(Date.now() / 60_000);

/** Linha vermelha do horário atual (só no navegador, para não divergir do servidor). */
export function NowLine({ day, pxPerMinute }: { day: string; pxPerMinute: number }) {
  const minute = useSyncExternalStore(subscribe, minuteNow, () => null);
  if (minute === null) return null;
  const parts = wallParts(new Date(minute * 60_000));
  if (parts.dayKey !== day) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute right-0 left-0 z-20" style={{ top: parts.minutes * pxPerMinute }}>
      <div className="relative h-0.5 bg-danger">
        <span className="absolute -top-[5px] -left-1.5 size-3 rounded-full bg-danger" />
      </div>
    </div>
  );
}
