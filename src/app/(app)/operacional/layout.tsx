import type { ReactNode } from "react";
import { OperacionalMenu } from "@/components/layout/operacional-menu";
import { OPERACIONAL_NAV } from "@/lib/nav";

export default function OperacionalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <OperacionalMenu title="Operacional" items={OPERACIONAL_NAV} />
      {children}
    </>
  );
}
