import type { ReactNode } from "react";
import { SectionTabs } from "@/components/layout/section-tabs";
import { COMERCIAL_NAV } from "@/lib/nav";

export default function ComercialLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="mb-6">
        <SectionTabs label="Comercial" items={COMERCIAL_NAV} />
      </div>
      {children}
    </>
  );
}
