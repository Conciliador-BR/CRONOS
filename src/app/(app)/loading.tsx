export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4">
      <span className="sr-only">Carregando…</span>
      <div className="h-8 w-48 rounded-md bg-surface-2 motion-safe:animate-pulse" />
      <div className="h-4 w-80 max-w-full rounded bg-surface-2 motion-safe:animate-pulse" />
      <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-32 rounded-lg bg-surface motion-safe:animate-pulse" />
        <div className="h-32 rounded-lg bg-surface motion-safe:animate-pulse" />
        <div className="h-32 rounded-lg bg-surface motion-safe:animate-pulse" />
      </div>
    </div>
  );
}
