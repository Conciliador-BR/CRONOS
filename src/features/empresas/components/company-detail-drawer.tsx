"use client";

import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/drawer";
import { marketLabel } from "../map-utils";
import type { CompanyDetail as Detail } from "../queries";
import { CompanyDetail } from "./company-detail";

/** Gaveta com o detalhe do cliente; aberta pela URL (?empresa=<id>). */
export function CompanyDetailDrawer({ detail, closeHref }: { detail: Detail | null; closeHref: string }) {
  const router = useRouter();
  return (
    <Drawer
      open={detail !== null}
      onClose={() => router.replace(closeHref, { scroll: false })}
      title={detail ? marketLabel(detail.company) : "Empresa"}
      description={detail ? `${detail.company.city ?? "Cidade não informada"}/${detail.company.uf}` : undefined}
      size="lg"
    >
      {detail ? <CompanyDetail detail={detail} /> : null}
    </Drawer>
  );
}
