import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AcquirerDetail, AcquirerSummary } from "./types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function signLogos(supabase: Supabase, paths: string[]) {
  const urls = new Map<string, string>();
  if (paths.length === 0) return urls;
  const { data } = await supabase.storage.from("acquirer-logos").createSignedUrls(paths, 3600);
  for (const item of data ?? []) if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  return urls;
}

/** Cards de adquirentes em ordem, com logo assinada (1 h). */
export async function getAcquirers(): Promise<AcquirerSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("acquirers")
    .select("id, name, color, position, logo_path, created_at, acquirer_documents(count), acquirer_notes(count)")
    .order("position")
    .order("created_at");
  if (error) throw new Error("Falha ao carregar adquirentes");
  const rows = data ?? [];
  const urls = await signLogos(supabase, rows.flatMap((row) => (row.logo_path ? [row.logo_path] : [])));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    position: row.position,
    logoUrl: row.logo_path ? (urls.get(row.logo_path) ?? null) : null,
    hasLogo: Boolean(row.logo_path),
    documentCount: row.acquirer_documents[0]?.count ?? 0,
    noteCount: row.acquirer_notes[0]?.count ?? 0,
  }));
}

export async function getAcquirerDetail(acquirerId: string): Promise<AcquirerDetail | null> {
  const supabase = await createClient();
  const [acquirerRes, docsRes, notesRes] = await Promise.all([
    supabase.from("acquirers").select("id, name, color, logo_path").eq("id", acquirerId).maybeSingle(),
    supabase
      .from("acquirer_documents")
      .select("id, file_name, size_bytes, created_at, uploader:profiles!acquirer_documents_uploaded_by_fkey(full_name)")
      .eq("acquirer_id", acquirerId)
      .order("created_at", { ascending: false }),
    supabase
      .from("acquirer_notes")
      .select("id, title, content, updated_at, editor:profiles!acquirer_notes_updated_by_fkey(full_name)")
      .eq("acquirer_id", acquirerId)
      .order("updated_at", { ascending: false }),
  ]);
  if (acquirerRes.error || docsRes.error || notesRes.error) throw new Error("Falha ao carregar a adquirente");
  const acquirer = acquirerRes.data;
  if (!acquirer) return null;
  const urls = await signLogos(supabase, acquirer.logo_path ? [acquirer.logo_path] : []);
  return {
    acquirer: {
      id: acquirer.id,
      name: acquirer.name,
      color: acquirer.color,
      logoUrl: acquirer.logo_path ? (urls.get(acquirer.logo_path) ?? null) : null,
    },
    documents: (docsRes.data ?? []).map((row) => ({
      id: row.id,
      fileName: row.file_name,
      sizeBytes: row.size_bytes,
      createdAt: row.created_at,
      uploaderName: row.uploader?.full_name || "—",
    })),
    notes: (notesRes.data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      updatedAt: row.updated_at,
      updatedByName: row.editor?.full_name || "—",
    })),
  };
}
