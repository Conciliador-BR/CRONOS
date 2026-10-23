export default function Loading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Carregando adquirentes…</span>
      <div className="mb-6 h-8 w-64 rounded-md bg-surface-2 motion-safe:animate-pulse" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-48 rounded-xl bg-surface motion-safe:animate-pulse" />
        ))}
      </div>
    </div>
  );
}
