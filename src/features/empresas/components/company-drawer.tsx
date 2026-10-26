"use client";

import { useCallback, useId, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useModalDialog } from "@/components/ui/dialog-base";
import { CloseButton } from "@/components/ui/modal";
import { formatCnae } from "../cnae";
import { prefersReducedMotion } from "../map-style";
import { marketLabel } from "../map-utils";
import type { CompanyDetail as Detail } from "../queries";
import { CompanyDetail } from "./company-detail";
import "./company-drawer.css";

const EXIT_MS = 240;
const delay = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * Card lateral do mercado, aberto pela URL (?empresa=<id>). <dialog> nativo: foco preso,
 * Esc e clique fora fecham, e o foco volta ao pino ou item da lista que abriu.
 */
export function CompanyDrawer({ detail }: { detail: Detail | null }) {
  const router = useRouter();
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const titleId = useId();
  const descId = useId();

  const onClose = useCallback(() => {
    setClosing(false);
    const url = new URL(window.location.href);
    if (!url.searchParams.has("empresa")) return;
    url.searchParams.delete("empresa");
    router.replace(`${url.pathname}${url.search}`, { scroll: false });
  }, [router]);

  const { ref } = useModalDialog(detail !== null, onClose);

  /** Toca a saída (desliza de volta) e só então fecha o <dialog>. */
  const requestClose = useCallback(() => {
    if (closeTimer.current !== null) return;
    if (prefersReducedMotion()) {
      ref.current?.close();
      return;
    }
    setClosing(true);
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null;
      ref.current?.close();
    }, EXIT_MS);
  }, [ref]);

  function onDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) requestClose();
  }

  const company = detail?.company;
  const located = company ? company.latitude !== null && company.longitude !== null : false;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={company ? descId : undefined}
      onClick={onDialogClick}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      data-closing={closing ? "" : undefined}
      className="em-drawer"
    >
      {detail && company ? (
        <div key={company.id} className="em-drawer-panel">
          <span aria-hidden className="em-drawer-handle" />
          <header className="relative flex items-start gap-3 px-5 pt-5 pb-3">
            <div className="em-drawer-item min-w-0 flex-1" style={delay(0)}>
              <p className="text-xs font-medium tracking-wide text-ring uppercase">
                {detail.parent ? "Filial" : detail.branches.length ? "Matriz" : "Mercado"}
              </p>
              <h2 id={titleId} className="mt-1 text-xl font-semibold text-balance text-fg">
                {marketLabel(company)}
              </h2>
              <p id={descId} className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                <MapPin aria-hidden className="size-3.5 shrink-0" />
                {company.city ?? "Cidade não informada"}/{company.uf}
              </p>
            </div>
            <CloseButton onClick={requestClose} />
          </header>

          <div className="em-drawer-item relative flex flex-wrap gap-2 px-5 pb-4" style={delay(1)}>
            {detail.parent ? <Badge variant="primary">Filial de {detail.parent.name}</Badge> : null}
            {detail.branches.length ? (
              <Badge variant="primary">
                Matriz · {detail.branches.length === 1 ? "1 filial" : `${detail.branches.length} filiais`}
              </Badge>
            ) : null}
            {company.cnae ? <Badge>CNAE {formatCnae(company.cnae)}</Badge> : null}
            {detail.client ? <Badge>{detail.client.name}</Badge> : null}
            <Badge variant={located ? "success" : "warning"} dot>
              {located ? "Local exato" : "Local aproximado"}
            </Badge>
          </div>

          <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-border px-5 py-4">
            <CompanyDetail detail={detail} className="em-drawer-stagger" />
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
