-- Semana de relatório (Operacional): tabelas no estilo Notion com propriedades tipadas.
-- report_sheets      uma tabela (ex.: "Semana de relatório")
-- report_properties  colunas; o tipo é fixo depois de criado; select/status guardam opções em jsonb
-- report_rows        linhas; company_id liga a linha a uma empresa cadastrada (coluna "Empresa")
-- report_cells       um valor por (linha, propriedade); FKs compostas garantem a mesma tabela

-- Tabelas ----------------------------------------------------------------------
create table public.report_sheets (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 120),
  description text not null default '' check (length(description) <= 500),
  -- Empresas novas entram sozinhas como linhas (perguntado ao criar a coluna Empresa).
  auto_add_companies boolean not null default false,
  position double precision not null default 0,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index report_sheets_position_idx on public.report_sheets (position);
create index report_sheets_created_by_idx on public.report_sheets (created_by);
create trigger report_sheets_updated_at before update on public.report_sheets
  for each row execute function public.set_updated_at();

-- Quem criou não muda (a exclusão depende disso).
create or replace function public.report_sheets_keep_creator()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_by := old.created_by;
  return new;
end;
$$;
revoke execute on function public.report_sheets_keep_creator() from public, anon, authenticated;
create trigger report_sheets_keep_creator before update on public.report_sheets
  for each row execute function public.report_sheets_keep_creator();

create table public.report_properties (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid not null references public.report_sheets (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 60),
  type text not null check (type in (
    'company', 'text', 'number', 'select', 'multi_select', 'status', 'date', 'person',
    'checkbox', 'url', 'phone', 'email', 'id', 'created_time', 'last_edited_time',
    'created_by', 'last_edited_by'
  )),
  -- select/multi_select/status: [{ id, name, color, group? }]; group só no status (todo|doing|done).
  options jsonb not null default '[]'::jsonb
    check (jsonb_typeof(options) = 'array' and pg_column_size(options) <= 16384),
  position double precision not null default 0,
  width integer check (width between 80 and 640),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, sheet_id)
);
-- Só uma coluna Empresa por tabela.
create unique index report_properties_one_company_key on public.report_properties (sheet_id) where type = 'company';
create index report_properties_sheet_position_idx on public.report_properties (sheet_id, position);
create trigger report_properties_updated_at before update on public.report_properties
  for each row execute function public.set_updated_at();

create table public.report_rows (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid not null references public.report_sheets (id) on delete cascade,
  company_id uuid references public.companies (id) on delete set null,
  -- Número sequencial exibido pela propriedade ID.
  seq bigint generated always as identity,
  position double precision not null default 0,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  updated_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, sheet_id),
  unique (sheet_id, company_id)
);
create index report_rows_sheet_position_idx on public.report_rows (sheet_id, position);
create index report_rows_company_id_idx on public.report_rows (company_id);
create index report_rows_created_by_idx on public.report_rows (created_by);
create index report_rows_updated_by_idx on public.report_rows (updated_by);

-- Autoria vem da sessão, nunca do cliente: "Criado por" fica fixo e "Última edição por"
-- recebe o usuário em toda gravação (sem sessão, ex.: service role, mantém o valor).
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
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  new.updated_by := coalesce(uid, new.updated_by);
  new.updated_at := now();
  return new;
end;
$$;
revoke execute on function public.report_rows_touch() from public, anon, authenticated;
create trigger report_rows_touch before insert or update on public.report_rows
  for each row execute function public.report_rows_touch();

create table public.report_cells (
  row_id uuid not null,
  property_id uuid not null,
  sheet_id uuid not null,
  value jsonb not null check (pg_column_size(value) <= 8192),
  primary key (row_id, property_id),
  foreign key (row_id, sheet_id) references public.report_rows (id, sheet_id) on delete cascade,
  foreign key (property_id, sheet_id) references public.report_properties (id, sheet_id) on delete cascade
);
-- (row_id, …) já é coberto pela chave primária.
create index report_cells_sheet_id_idx on public.report_cells (sheet_id);
create index report_cells_property_sheet_idx on public.report_cells (property_id, sheet_id);

-- Editar uma célula conta como edição da linha ("Última edição" e "Última edição por").
create or replace function public.report_cells_touch_row()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.report_rows set updated_at = now() where id = coalesce(new.row_id, old.row_id);
  return null;
end;
$$;
revoke execute on function public.report_cells_touch_row() from public, anon, authenticated;
create trigger report_cells_touch_row after insert or update or delete on public.report_cells
  for each row execute function public.report_cells_touch_row();

-- Empresas ---------------------------------------------------------------------
-- Empresa cadastrada vira linha nas tabelas com auto_add_companies. Roda como quem cadastra
-- (gestor, membro ativo), então a RLS de report_rows continua valendo.
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
  on conflict (sheet_id, company_id) do nothing;
  return null;
end;
$$;
revoke execute on function public.report_add_company_rows() from public, anon, authenticated;
create trigger companies_report_rows after insert on public.companies
  for each row execute function public.report_add_company_rows();

-- Adiciona de uma vez as empresas já cadastradas que ainda não estão na tabela.
-- security invoker: a RLS de companies e report_rows decide o que pode ser lido e inserido.
create or replace function public.report_sync_companies(p_sheet_id uuid)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inserted integer;
begin
  insert into public.report_rows (sheet_id, company_id, position)
  select p_sheet_id, c.id,
    coalesce((select max(r.position) from public.report_rows r where r.sheet_id = p_sheet_id), 0)
      + row_number() over (order by coalesce(c.market_name, c.trade_name, c.legal_name))
  from public.companies c
  where exists (select 1 from public.report_sheets s where s.id = p_sheet_id)
    and not exists (select 1 from public.report_rows r where r.sheet_id = p_sheet_id and r.company_id = c.id)
  on conflict (sheet_id, company_id) do nothing;
  get diagnostics inserted = row_count;
  return inserted;
end;
$$;
revoke execute on function public.report_sync_companies(uuid) from public, anon;
grant execute on function public.report_sync_companies(uuid) to authenticated;

-- RLS --------------------------------------------------------------------------
-- Toda a equipe ativa lê e edita (como os quadros de Missões). Excluir a tabela inteira:
-- só quem criou ou gestor.
alter table public.report_sheets enable row level security;
alter table public.report_properties enable row level security;
alter table public.report_rows enable row level security;
alter table public.report_cells enable row level security;

create policy report_sheets_select on public.report_sheets for select to authenticated
  using (public.is_member());
create policy report_sheets_insert on public.report_sheets for insert to authenticated
  with check (public.is_member() and created_by = (select auth.uid()));
create policy report_sheets_update on public.report_sheets for update to authenticated
  using (public.is_member()) with check (public.is_member());
create policy report_sheets_delete on public.report_sheets for delete to authenticated
  using (public.is_manager() or (public.is_member() and created_by = (select auth.uid())));

create policy report_properties_member on public.report_properties for all to authenticated
  using (public.is_member()) with check (public.is_member());
create policy report_rows_member on public.report_rows for all to authenticated
  using (public.is_member()) with check (public.is_member());
create policy report_cells_member on public.report_cells for all to authenticated
  using (public.is_member()) with check (public.is_member());
