import type { ReactNode } from "react";

export function SectionTitle({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h3 id={id} className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
      {children}
    </h3>
  );
}
