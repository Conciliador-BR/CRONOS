"use client";

import { Download, FileText, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/browser";
import { formatBytes, MAX_DOCUMENT_BYTES } from "../../shared/files";
import { formatShortDate, formatTime } from "../../shared/tz";
import { deleteDocument, getDocumentDownloadUrl, registerDocument, requestDocumentUpload } from "../document-actions";
import type { AcquirerDocument } from "../types";

type Status = { kind: "idle" } | { kind: "uploading"; name: string } | { kind: "error"; message: string } | { kind: "done"; message: string };

/** Documentos da adquirente: envio direto ao Storage (URL assinada), lista e download. */
export function DocumentsSection({ acquirerId, documents }: { acquirerId: string; documents: AcquirerDocument[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    const list = Array.from(files ?? []);
    if (inputRef.current) inputRef.current.value = "";
    for (const file of list) {
      if (file.size > MAX_DOCUMENT_BYTES) {
        setStatus({ kind: "error", message: `"${file.name}" passa de 50 MB.` });
        continue;
      }
      setStatus({ kind: "uploading", name: file.name });
      const ticket = await requestDocumentUpload({ acquirerId, fileName: file.name, size: file.size });
      if (!ticket.ok) return setStatus({ kind: "error", message: ticket.error });
      const { error } = await createClient()
        .storage.from("acquirer-docs")
        .uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: file.type || "application/octet-stream" });
      if (error) return setStatus({ kind: "error", message: `Falha ao enviar "${file.name}". Tente de novo.` });
      const saved = await registerDocument({ acquirerId, path: ticket.path, fileName: file.name });
      if (!saved.ok) return setStatus({ kind: "error", message: saved.error });
      setStatus({ kind: "done", message: `"${file.name}" enviado.` });
    }
  }

  async function download(id: string) {
    setBusyId(id);
    const result = await getDocumentDownloadUrl(id);
    setBusyId(null);
    if (!result.ok) return setStatus({ kind: "error", message: result.error });
    window.location.assign(result.url);
  }

  async function remove(id: string) {
    setBusyId(id);
    const result = await deleteDocument(id);
    setBusyId(null);
    setConfirmId(null);
    if (!result.ok) setStatus({ kind: "error", message: result.error });
  }

  return (
    <section aria-labelledby="docs-title" className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 id="docs-title" className="flex-1 text-base font-semibold">
          Documentos
        </h2>
        <input ref={inputRef} type="file" multiple className="sr-only" id="doc-file" onChange={(e) => upload(e.target.files)} tabIndex={-1} />
        <Button size="sm" loading={status.kind === "uploading"} onClick={() => inputRef.current?.click()}>
          {status.kind === "uploading" ? null : <Upload aria-hidden />}
          {status.kind === "uploading" ? "Enviando…" : "Anexar documento"}
        </Button>
      </div>
      <div aria-live="polite" className="empty:hidden">
        {status.kind === "uploading" ? <p className="mb-3 text-sm text-muted">Enviando “{status.name}”…</p> : null}
        {status.kind === "done" ? <Alert tone="success" className="mb-3">{status.message}</Alert> : null}
      </div>
      {status.kind === "error" ? <Alert tone="danger" className="mb-3">{status.message}</Alert> : null}
      {documents.length === 0 ? (
        <EmptyState icon={FileText} title="Nenhum documento" description="Anexe manuais, coleções de API, contratos… (até 50 MB cada)." />
      ) : (
        <ul className="divide-y divide-border">
          {documents.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center gap-3 py-3">
              <FileText aria-hidden className="size-5 shrink-0 text-ring" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg" title={doc.fileName}>{doc.fileName}</p>
                <p className="text-xs text-muted">
                  {formatBytes(doc.sizeBytes)} · {formatShortDate(doc.createdAt)}, {formatTime(doc.createdAt)} · {doc.uploaderName}
                </p>
              </div>
              {confirmId === doc.id ? (
                <div className="flex items-center gap-2" role="group" aria-label={`Confirmar exclusão de ${doc.fileName}`}>
                  <span className="text-xs text-fg">Excluir?</span>
                  <Button variant="danger" size="sm" loading={busyId === doc.id} onClick={() => remove(doc.id)}>Excluir</Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmId(null)}>Cancelar</Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Button variant="secondary" size="sm" loading={busyId === doc.id} onClick={() => download(doc.id)} aria-label={`Baixar ${doc.fileName}`}>
                    {busyId === doc.id ? null : <Download aria-hidden />}
                    <span className="hidden sm:inline">Baixar</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="size-8 px-0 hover:text-danger" aria-label={`Excluir ${doc.fileName}`} onClick={() => setConfirmId(doc.id)}>
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
