export default function Loading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Carregando quadros…</span>
      <div className="mb-6 h-8 w-40 rounded-md bg-surface-2 motion-safe:animate-pulse" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 rounded-xl bg-surface-2 motion-safe:animate-pulse" />
        ))}
      </div>
    </div>
  );
}
