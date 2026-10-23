export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">Carregando insights…</span>
      <div className="h-8 w-48 rounded-md bg-surface-2 motion-safe:animate-pulse" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 rounded-xl bg-surface motion-safe:animate-pulse" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 rounded-xl bg-surface motion-safe:animate-pulse" />
        <div className="h-72 rounded-xl bg-surface motion-safe:animate-pulse" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-44 rounded-xl bg-surface motion-safe:animate-pulse" />
        ))}
      </div>
    </div>
  );
}
