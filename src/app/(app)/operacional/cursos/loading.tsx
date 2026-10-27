export default function Loading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Carregando cursos…</span>
      <div className="mb-6 h-8 w-32 rounded-md bg-surface-2 motion-safe:animate-pulse" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="aspect-video bg-surface-2 motion-safe:animate-pulse" />
            <div className="h-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
