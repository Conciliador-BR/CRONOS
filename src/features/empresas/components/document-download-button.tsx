"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCompanyDocumentUrl } from "../actions";

/** Gera uma URL assinada de 60 s e inicia o download. */
export function DocumentDownloadButton({ documentId, fileName }: { documentId: string; fileName: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function download() {
    setError(null);
    startTransition(async () => {
      const result = await getCompanyDocumentUrl(documentId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.location.assign(result.url);
    });
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button variant="secondary" size="sm" onClick={download} loading={pending} aria-label={`Baixar ${fileName}`}>
        {pending ? null : <Download aria-hidden />}
        Baixar
      </Button>
      {error ? (
        <span role="alert" className="text-xs text-danger">
          {error}
        </span>
      ) : null}
    </span>
  );
}
