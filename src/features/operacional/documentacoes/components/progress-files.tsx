"use client";

import { Download, FileText, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/browser";
import { formatBytes, MAX_DOCUMENT_BYTES } from "../../shared/files";
import { formatShortDate } from "../../shared/tz";
import {
  deleteProgressFile,
  getProgressFileUrl,
  listProgressFiles,
  registerProgressFile,
  requestProgressUpload,
  type ProgressFile,
} from "../progress-actions";

/** Anexos de uma empresa numa adquirente: envio direto ao Storage (URL assinada), download e exclusão. */
export function ProgressFiles({
  acquirerId,
  companyId,
  onCount,
}: {
  acquirerId: string;
  companyId: string;
  onCount: (count: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<ProgressFile[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "error" | "ok"; text: string } | null>(null);

  async function reload() {
    const result = await listProgressFiles({ acquirerId, companyId });
    if (!result.ok) return setMessage({ tone: "error", text: result.error });
    setFiles(result.files);
    onCount(result.files.length);
  }

  useEffect(() => {
    void listProgressFiles({ acquirerId, companyId }).then((result) => {
      if (result.ok) setFiles(result.files);
      else setMessage({ tone: "error", text: result.error });
    });
  }, [acquirerId, companyId]);

  async function upload(list: FileList | null) {
    const chosen = Array.from(list ?? []);
    if (inputRef.current) inputRef.current.value = "";
    for (const file of chosen) {
      if (file.size > MAX_DOCUMENT_BYTES) {
        setMessage({ tone: "error", text: `"${file.name}" passa de 50 MB.` });
        continue;
      }
      setBusy("upload");
      setMessage(null);
      const ticket = await requestProgressUpload({ acquirerId, companyId, fileName: file.name, size: file.size });
      if (!ticket.ok) {
        setBusy(null);
        return setMessage({ tone: "error", text: ticket.error });
      }
      const { error } = await createClient()
        .storage.from("acquirer-docs")
        .uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: file.type || "application/octet-stream" });
      const saved = error ? null : await registerProgressFile({ acquirerId, companyId, path: ticket.path, fileName: file.name });
      setBusy(null);
      if (!saved?.ok) return setMessage({ tone: "error", text: saved?.error ?? `Falha ao enviar "${file.name}". Tente de novo.` });
      setMessage({ tone: "ok", text: `"${file.name}" anexado.` });
    }
    await reload();
  }

  async function download(id: string) {
    setBusy(id);
    const result = await getProgressFileUrl(id);
    setBusy(null);
    if (!result.ok) return setMessage({ tone: "error", text: result.error });
    window.location.assign(result.url);
  }

  async function remove(file: ProgressFile) {
    if (!window.confirm(`Excluir o anexo "${file.fileName}"?`)) return;
    setBusy(file.id);
    const result = await deleteProgressFile(file.id);
    setBusy(null);
    if (!result.ok) return setMessage({ tone: "error", text: result.error });
    await reload();
  }

  return (
    <section aria-labelledby="progress-files-title" className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 id="progress-files-title" className="text-sm font-medium text-fg">
          Anexos
        </h3>
        <input ref={inputRef} type="file" multiple className="sr-only" tabIndex={-1} aria-hidden onChange={(event) => void upload(event.target.files)} />
        <Button variant="secondary" size="sm" loading={busy === "upload"} onClick={() => inputRef.current?.click()}>
          <Upload aria-hidden />
          Anexar arquivo
        </Button>
      </div>
      {message ? (
        <p role={message.tone === "error" ? "alert" : "status"} className={message.tone === "error" ? "text-xs font-medium text-danger" : "text-xs text-muted"}>
          {message.text}
        </p>
      ) : null}
      {files === null ? (
        <Spinner />
      ) : files.length === 0 ? (
        <p className="text-xs text-muted">Nenhum anexo. Até 50 MB por arquivo.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {files.map((file) => (
            <li key={file.id} className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5">
              <FileText aria-hidden className="size-4 shrink-0 text-muted" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-fg">{file.fileName}</span>
                <span className="block text-xs text-muted">
                  {formatBytes(file.sizeBytes)} · {formatShortDate(file.createdAt)}
                </span>
              </span>
              <Button variant="ghost" size="sm" aria-label={`Baixar ${file.fileName}`} disabled={busy === file.id} onClick={() => void download(file.id)}>
                <Download aria-hidden />
              </Button>
              <Button variant="ghost" size="sm" aria-label={`Excluir ${file.fileName}`} disabled={busy === file.id} onClick={() => void remove(file)}>
                <Trash2 aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
