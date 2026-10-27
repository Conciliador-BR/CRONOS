"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DocumentDownloadButton } from "@/features/empresas/components/document-download-button";
import { formatBytes } from "@/features/empresas/format";
import { createClient } from "@/lib/supabase/browser";
import { deleteCompanyDocument, prepareCompanyDocumentUpload, registerCompanyDocument } from "../document-actions";
import { MAX_PDF_BYTES } from "../limits";
import { ConfirmDialog } from "./confirm-dialog";

type Doc = { id: string; fileName: string; sizeBytes: number; createdAt: string };

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" });

/** PDFs da empresa: enviar (direto ao Storage com token gerado no servidor), baixar e excluir. */
export function CompanyDocuments({ companyId, documents }: { companyId: string; documents: Doc[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ tone: "danger" | "success"; text: string } | null>(null);
  const [toDelete, setToDelete] = useState<Doc | null>(null);

  async function uploadOne(file: File) {
    if (file.type !== "application/pdf") return `${file.name}: envie apenas PDF.`;
    if (file.size > MAX_PDF_BYTES) return `${file.name}: o PDF pode ter até 20 MB.`;
    const ticket = await prepareCompanyDocumentUpload(companyId, { fileName: file.name, size: file.size, type: file.type });
    if (!ticket.ok) return `${file.name}: ${ticket.error}`;
    const { error } = await createClient()
      .storage.from("company-docs")
      .uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: "application/pdf" });
    if (error) return `${file.name}: falha no envio do arquivo.`;
    const saved = await registerCompanyDocument(companyId, { path: ticket.path, fileName: file.name });
    return saved.ok ? null : `${file.name}: ${saved.error}`;
  }

  function onFiles(files: FileList | null) {
    const list = files ? [...files] : [];
    if (!list.length) return;
    setStatus(null);
    startTransition(async () => {
      const errors: string[] = [];
      for (const file of list) {
        const error = await uploadOne(file);
        if (error) errors.push(error);
      }
      if (inputRef.current) inputRef.current.value = "";
      const sent = list.length - errors.length;
      setStatus(
        errors.length
          ? { tone: "danger", text: [sent ? `${sent} PDF(s) enviados.` : null, ...errors].filter(Boolean).join(" ") }
          : { tone: "success", text: sent === 1 ? "PDF anexado." : `${sent} PDFs anexados.` },
      );
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          id="company-pdf"
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="sr-only"
          onChange={(e) => onFiles(e.target.files)}
          disabled={pending}
        />
        <Button variant="secondary" onClick={() => inputRef.current?.click()} loading={pending}>
          {pending ? "Enviando…" : (
            <>
              <Upload aria-hidden />
              Anexar PDF
            </>
          )}
        </Button>
        <span className="text-xs text-muted">Somente PDF, até 20 MB por arquivo.</span>
      </div>

      <div aria-live="polite">{status ? <Alert tone={status.tone}>{status.text}</Alert> : null}</div>

      {documents.length === 0 ? (
        <EmptyState icon={FileText} title="Nenhum PDF anexado" description="Contrato social, comprovantes e outros documentos da empresa." />
      ) : (
        <ul className="flex flex-col gap-2">
          {documents.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2">
              <FileText aria-hidden className="size-4 shrink-0 text-ring" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-medium text-fg" title={d.fileName}>
                  {d.fileName}
                </p>
                <p className="text-xs text-muted">
                  {formatBytes(d.sizeBytes)} · {dateFormat.format(new Date(d.createdAt))}
                </p>
              </div>
              <DocumentDownloadButton documentId={d.id} fileName={d.fileName} />
              <Button variant="ghost" size="icon" aria-label={`Excluir ${d.fileName}`} onClick={() => setToDelete(d)}>
                <Trash2 aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Excluir PDF?"
        description={`“${toDelete?.fileName ?? ""}” será apagado definitivamente.`}
        confirmLabel="Excluir PDF"
        pendingLabel="Excluindo…"
        onConfirm={() => deleteCompanyDocument(toDelete!.id)}
      />
    </div>
  );
}
