export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4">
      <span className="sr-only">Carregando pipeline…</span>
      <div className="h-8 w-32 rounded-md bg-surface-2 motion-safe:animate-pulse" />
      <div className="h-10 w-full max-w-3xl rounded-lg bg-surface-2 motion-safe:animate-pulse" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-96 w-72 shrink-0 rounded-xl bg-surface motion-safe:animate-pulse" />
        ))}
      </div>
    </div>
  );
}
