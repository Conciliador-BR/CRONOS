export default function Loading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Carregando agenda…</span>
      <div className="mb-6 h-8 w-32 rounded-md bg-surface-2 motion-safe:animate-pulse" />
      <div className="mb-4 h-9 w-full max-w-xl rounded-md bg-surface-2 motion-safe:animate-pulse" />
      <div className="h-[480px] rounded-xl bg-surface motion-safe:animate-pulse" />
    </div>
  );
}
