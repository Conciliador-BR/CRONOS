import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AcquirerLogo } from "@/features/operacional/documentacoes/components/acquirer-logo";
import { DocumentsSection } from "@/features/operacional/documentacoes/components/documents-section";
import { NotesWorkspace } from "@/features/operacional/documentacoes/components/notes-workspace";
import { getAcquirerDetail } from "@/features/operacional/documentacoes/queries";

export const metadata: Metadata = { title: "Adquirente · Documentações de API" };

export default async function Page(props: PageProps<"/operacional/documentacoes/[acquirerId]">) {
  const { acquirerId } = await props.params;
  if (!z.uuid().safeParse(acquirerId).success) notFound();
  const detail = await getAcquirerDetail(acquirerId);
  if (!detail) notFound();
  const { acquirer } = detail;

  return (
    <>
      <header className="mb-6 flex items-center gap-4">
        <Link
          href="/operacional/documentacoes"
          aria-label="Voltar para as adquirentes"
          className="grid size-10 shrink-0 place-items-center rounded-md border border-border bg-surface text-muted hover:bg-surface-2 hover:text-fg"
        >
          <ArrowLeft aria-hidden className="size-4" />
        </Link>
        <AcquirerLogo name={acquirer.name} color={acquirer.color} logoUrl={acquirer.logoUrl} className="h-14 w-20 shrink-0 text-xl" />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{acquirer.name}</h1>
          <p className="text-sm text-muted">Documentação de API</p>
        </div>
      </header>
      <div className="flex flex-col gap-6">
        <DocumentsSection acquirerId={acquirer.id} documents={detail.documents} />
        <NotesWorkspace acquirerId={acquirer.id} initialNotes={detail.notes} />
      </div>
    </>
  );
}
