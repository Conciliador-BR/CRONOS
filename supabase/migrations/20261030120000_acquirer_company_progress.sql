-- Progresso da integração de cada empresa em cada adquirente (aba Progresso de Documentações de API).
-- Sem linha = "Não iniciado". Etapas em ordem: enviado_documentacao → assinado → enviado_liberar → automatico.

create table public.acquirer_company_progress (
  company_id uuid not null references public.companies (id) on delete cascade,
  acquirer_id uuid not null references public.acquirers (id) on delete cascade,
  status text not null
    constraint acquirer_company_progress_status_check
      check (status in ('enviado_documentacao', 'assinado', 'enviado_liberar', 'automatico')),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null default auth.uid(),
  primary key (company_id, acquirer_id)
);

create index acquirer_company_progress_acquirer_idx on public.acquirer_company_progress (acquirer_id);

-- Autoria e data vêm do banco, não do cliente.
create or replace function public.acquirer_company_progress_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

create trigger acquirer_company_progress_touch
  before insert or update on public.acquirer_company_progress
  for each row execute function public.acquirer_company_progress_touch();

alter table public.acquirer_company_progress enable row level security;

create policy acquirer_company_progress_select on public.acquirer_company_progress
  for select to authenticated using (public.is_member());
create policy acquirer_company_progress_insert on public.acquirer_company_progress
  for insert to authenticated with check (public.is_member());
create policy acquirer_company_progress_update on public.acquirer_company_progress
  for update to authenticated using (public.is_member()) with check (public.is_member());
create policy acquirer_company_progress_delete on public.acquirer_company_progress
  for delete to authenticated using (public.is_member());
