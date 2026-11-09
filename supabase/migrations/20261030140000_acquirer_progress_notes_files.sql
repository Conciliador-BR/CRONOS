-- Aba Progresso: anotação, anexos e "remover desta adquirente" em cada empresa.
-- status passa a aceitar null (Não iniciado) para a linha guardar só a anotação ou a remoção.

alter table public.acquirer_company_progress
  alter column status drop not null,
  add column note text not null default ''
    constraint acquirer_company_progress_note_check check (char_length(note) <= 5000),
  add column removed boolean not null default false;

create index acquirer_company_progress_updated_by_idx on public.acquirer_company_progress (updated_by);

-- Arquivos no bucket privado acquirer-docs, em progress/<acquirerId>/<companyId>/<uuid>-<nome>.
create table public.acquirer_progress_files (
  id uuid primary key default gen_random_uuid(),
  acquirer_id uuid not null references public.acquirers (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  storage_path text not null unique,
  file_name text not null constraint acquirer_progress_files_name_check check (char_length(file_name) between 1 and 255),
  size_bytes bigint not null constraint acquirer_progress_files_size_check check (size_bytes > 0),
  uploaded_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index acquirer_progress_files_pair_idx on public.acquirer_progress_files (acquirer_id, company_id);
create index acquirer_progress_files_company_idx on public.acquirer_progress_files (company_id);
create index acquirer_progress_files_uploaded_by_idx on public.acquirer_progress_files (uploaded_by);

alter table public.acquirer_progress_files enable row level security;

create policy acquirer_progress_files_select on public.acquirer_progress_files
  for select to authenticated using (public.is_member());
create policy acquirer_progress_files_insert on public.acquirer_progress_files
  for insert to authenticated with check (public.is_member() and uploaded_by = auth.uid());
create policy acquirer_progress_files_delete on public.acquirer_progress_files
  for delete to authenticated using (public.is_member());
