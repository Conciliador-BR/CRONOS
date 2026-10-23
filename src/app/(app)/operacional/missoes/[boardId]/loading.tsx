export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="flex h-[calc(100dvh-11rem)] min-h-[440px] flex-col rounded-xl bg-surface ring-1 ring-border">
      <span className="sr-only">Carregando quadro…</span>
      <div className="h-13 border-b border-border" />
      <div className="flex gap-3 overflow-hidden p-3">
        {[180, 260, 120].map((height) => (
          <div key={height} className="w-[272px] shrink-0 rounded-xl bg-surface-2 motion-safe:animate-pulse" style={{ height }} />
        ))}
      </div>
    </div>
  );
}
