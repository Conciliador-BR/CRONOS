import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { SheetView } from "@/features/operacional/relatorios/components/sheet-view";
import { getReportSheet } from "@/features/operacional/relatorios/queries";

export const metadata: Metadata = { title: "Semana de relatório" };

export default async function Page(props: PageProps<"/operacional/relatorios/[sheetId]">) {
  const { sheetId } = await props.params;
  if (!z.uuid().safeParse(sheetId).success) notFound();
  const data = await getReportSheet(sheetId);
  if (!data) notFound();
  return <SheetView data={data} />;
}
