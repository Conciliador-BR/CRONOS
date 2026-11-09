export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4">
      <span className="sr-only">Carregando tabela…</span>
      <div className="h-9 w-72 rounded-md bg-surface-2 motion-safe:animate-pulse" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-32 rounded-xl bg-surface-2 motion-safe:animate-pulse" />
        ))}
      </div>
      <div className="h-80 rounded-xl bg-surface-2 motion-safe:animate-pulse" />
    </div>
  );
}
