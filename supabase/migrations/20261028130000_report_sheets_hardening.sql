-- Endurecimento da Semana de relatório (revisão de segurança de 20261028120000).

-- 1) Empresa excluída (inclusive no rollback do cadastro) leva junto a linha dela, sem órfãs.
alter table public.report_rows drop constraint report_rows_company_id_fkey,
  add constraint report_rows_company_id_fkey foreign key (company_id)
    references public.companies (id) on delete cascade;

-- 2) Tipo e tabela de uma coluna são fixos; a linha não muda de tabela.
create or replace function public.report_properties_keep_fixed()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.type := old.type;
  new.sheet_id := old.sheet_id;
  return new;
end;
$$;
revoke execute on function public.report_properties_keep_fixed() from public, anon, authenticated;
create trigger report_properties_keep_fixed before update on public.report_properties
  for each row execute function public.report_properties_keep_fixed();

create or replace function public.report_rows_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(uid, new.created_by);
    new.created_at := now();
  else
    new.sheet_id := old.sheet_id;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  new.updated_by := coalesce(uid, new.updated_by);
  new.updated_at := now();
  return new;
end;
$$;

-- 3) Limites por tabela: 2000 linhas e 50 colunas.
create or replace function public.report_guard_limits()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext(tg_table_name || new.sheet_id::text));
  if tg_table_name = 'report_rows'
     and (select count(*) from public.report_rows r where r.sheet_id = new.sheet_id) >= 2000 then
    raise exception 'A tabela chegou ao limite de 2000 linhas.' using errcode = '23514';
  end if;
  if tg_table_name = 'report_properties'
     and (select count(*) from public.report_properties p where p.sheet_id = new.sheet_id) >= 50 then
    raise exception 'A tabela chegou ao limite de 50 colunas.' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke execute on function public.report_guard_limits() from public, anon, authenticated;
create trigger report_rows_limit before insert on public.report_rows
  for each row execute function public.report_guard_limits();
create trigger report_properties_limit before insert on public.report_properties
  for each row execute function public.report_guard_limits();

-- Tabela cheia não pode impedir o cadastro de empresas: o trigger pula as que estão no limite.
create or replace function public.report_add_company_rows()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.report_rows (sheet_id, company_id, position)
  select s.id, new.id,
    coalesce((select max(r.position) from public.report_rows r where r.sheet_id = s.id), 0) + 1
  from public.report_sheets s
  where s.auto_add_companies
    and (select count(*) from public.report_rows r where r.sheet_id = s.id) < 2000
  on conflict (sheet_id, company_id) do nothing;
  return null;
end;
$$;

-- Índice exato da FK composta (row_id, sheet_id) apontado pelo advisor.
create index report_cells_row_sheet_idx on public.report_cells (row_id, sheet_id);
