import type { ReactNode } from "react";
import { SectionTabs } from "@/components/layout/section-tabs";
import { DOCUMENTACOES_NAV } from "@/lib/nav";

export default function DocumentacoesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="mb-6">
        <SectionTabs label="Documentações de API" items={DOCUMENTACOES_NAV} />
      </div>
      {children}
    </>
  );
}
