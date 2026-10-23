-- CRONOS CRM — schema inicial
-- Valores monetários em centavos (bigint). Datas em timestamptz.
-- Toda tabela em public tem RLS habilitado; acesso só para membros ativos.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('admin', 'gestor', 'funcionario');
create type public.pipeline_stage as enum (
  'lead_recebido', 'diagnostico_feito', 'reuniao_marcada',
  'follow_up', 'cliente_fechado', 'cliente_perdido'
);
create type public.lead_source as enum ('marketing', 'venda', 'indicacao', 'outro');
create type public.lead_temperature as enum ('quente', 'frio');
create type public.deal_type as enum ('consultoria_avancada', 'somente_sistema');
create type public.video_source as enum ('upload', 'drive', 'youtube');

-- ---------------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Equipe
-- ---------------------------------------------------------------------------
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(name) between 1 and 80),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (length(full_name) <= 120),
  email text not null default '',
  phone text check (length(phone) <= 30),
  job_title text check (length(job_title) <= 80),
  avatar_path text,
  team_id uuid references public.teams (id) on delete set null,
  role public.app_role not null default 'funcionario',
  active boolean not null default false,
  commission_rate numeric(5, 2) not null default 0 check (commission_rate between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_team_id_idx on public.profiles (team_id);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Funções de autorização (security definer evita recursão de RLS em profiles).
create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.active
  );
$$;

create or replace function public.has_role(roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.active and p.role = any (roles)
  );
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role(array['admin', 'gestor']::public.app_role[]);
$$;

revoke execute on function public.is_member() from public, anon;
revoke execute on function public.has_role(public.app_role[]) from public, anon;
revoke execute on function public.is_manager() from public, anon;
grant execute on function public.is_member() to authenticated;
grant execute on function public.has_role(public.app_role[]) to authenticated;
grant execute on function public.is_manager() to authenticated;

-- Cria o perfil ao criar o usuário. O primeiro usuário vira admin ativo;
-- os demais nascem inativos, a menos que o admin (service role) os crie com
-- app_metadata.cronos_invited = true. Cadastro público não dá acesso a nada.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  first_user boolean;
  invited boolean := coalesce((new.raw_app_meta_data ->> 'cronos_invited')::boolean, false);
  invited_role public.app_role := coalesce(
    nullif(new.raw_app_meta_data ->> 'cronos_role', '')::public.app_role,
    'funcionario'
  );
begin
  perform pg_advisory_xact_lock(hashtext('cronos_first_admin'));
  select not exists (select 1 from public.profiles) into first_user;

  insert into public.profiles (id, email, full_name, role, active)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when first_user then 'admin' when invited then invited_role else 'funcionario' end,
    first_user or invited
  );
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Funcionário comum só edita dados pessoais do próprio perfil.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or public.has_role(array['admin']::public.app_role[]) then
    return new;
  end if;
  if new.role is distinct from old.role
     or new.active is distinct from old.active
     or new.team_id is distinct from old.team_id
     or new.commission_rate is distinct from old.commission_rate
     or new.email is distinct from old.email then
    raise exception 'Somente administradores alteram cargo, status, time, comissão ou e-mail';
  end if;
  return new;
end;
$$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

create table public.sales_goals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  goal_cents bigint not null check (goal_cents >= 0),
  created_at timestamptz not null default now(),
  unique (profile_id, month)
);

-- ---------------------------------------------------------------------------
-- Empresas e clientes
-- ---------------------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 160),
  document text check (length(document) <= 20),
  email text check (length(email) <= 160),
  phone text check (length(phone) <= 30),
  notes text check (length(notes) <= 5000),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index clients_created_by_idx on public.clients (created_by);
create trigger clients_updated_at before update on public.clients
  for each row execute function public.set_updated_at();

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id) on delete set null,
  cnpj char(14) not null unique check (cnpj ~ '^[0-9]{14}$'),
  legal_name text not null check (length(legal_name) between 1 and 200),
  trade_name text check (length(trade_name) <= 200),
  market_name text check (length(market_name) <= 200),
  cep char(8) check (cep ~ '^[0-9]{8}$'),
  street text check (length(street) <= 200),
  number text check (length(number) <= 20),
  complement text check (length(complement) <= 120),
  district text check (length(district) <= 120),
  city text check (length(city) <= 120),
  uf char(2) not null check (uf in (
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB',
    'PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
  )),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index companies_client_id_idx on public.companies (client_id);
create index companies_uf_idx on public.companies (uf);
create index companies_created_by_idx on public.companies (created_by);
create trigger companies_updated_at before update on public.companies
  for each row execute function public.set_updated_at();

create table public.company_ec_numbers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  acquirer text not null check (length(acquirer) between 1 and 80),
  ec_number text not null check (length(ec_number) between 1 and 40),
  created_at timestamptz not null default now()
);
create index company_ec_numbers_company_id_idx on public.company_ec_numbers (company_id);

create table public.company_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  bank text not null check (length(bank) between 1 and 80),
  agency text not null check (length(agency) between 1 and 10),
  account text not null check (length(account) between 1 and 20),
  account_type text check (account_type in ('corrente', 'poupanca', 'pagamento')),
  created_at timestamptz not null default now()
);
create index company_bank_accounts_company_id_idx on public.company_bank_accounts (company_id);

create table public.company_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check (length(file_name) between 1 and 255),
  size_bytes bigint not null check (size_bytes > 0),
  uploaded_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index company_documents_company_id_idx on public.company_documents (company_id);
create index company_documents_uploaded_by_idx on public.company_documents (uploaded_by);

-- ---------------------------------------------------------------------------
-- Operacional — Missões (kanban estilo Trello)
-- ---------------------------------------------------------------------------
create table public.boards (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  background text not null default '#0b1220' check (length(background) <= 40),
  position double precision not null default 0,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index boards_created_by_idx on public.boards (created_by);

create table public.board_lists (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards (id) on delete cascade,
  name text not null check (length(name) between 1 and 120),
  position double precision not null default 0,
  created_at timestamptz not null default now()
);
create index board_lists_board_id_idx on public.board_lists (board_id, position);

create table public.labels (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards (id) on delete cascade,
  name text not null default '' check (length(name) <= 60),
  color text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now()
);
create index labels_board_id_idx on public.labels (board_id);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards (id) on delete cascade,
  list_id uuid not null references public.board_lists (id) on delete cascade,
  title text not null check (length(title) between 1 and 300),
  description text check (length(description) <= 20000),
  due_at timestamptz,
  completed boolean not null default false,
  position double precision not null default 0,
  archived boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cards_list_id_idx on public.cards (list_id, position);
create index cards_board_id_idx on public.cards (board_id);
create index cards_created_by_idx on public.cards (created_by);
create trigger cards_updated_at before update on public.cards
  for each row execute function public.set_updated_at();

create table public.card_labels (
  card_id uuid not null references public.cards (id) on delete cascade,
  label_id uuid not null references public.labels (id) on delete cascade,
  primary key (card_id, label_id)
);
create index card_labels_label_id_idx on public.card_labels (label_id);

create table public.card_assignees (
  card_id uuid not null references public.cards (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  primary key (card_id, profile_id)
);
create index card_assignees_profile_id_idx on public.card_assignees (profile_id);

create table public.card_checklist_items (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards (id) on delete cascade,
  content text not null check (length(content) between 1 and 500),
  done boolean not null default false,
  position double precision not null default 0
);
create index card_checklist_items_card_id_idx on public.card_checklist_items (card_id);

-- ---------------------------------------------------------------------------
-- Operacional — Agenda
-- ---------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 200),
  description text check (length(description) <= 5000),
  location text check (length(location) <= 300),
  meeting_url text check (meeting_url ~ '^https://'),
  color text not null default '#2563eb' check (color ~ '^#[0-9a-fA-F]{6}$'),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  all_day boolean not null default false,
  lead_id uuid,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  check (ends_at >= starts_at)
);
create index events_starts_at_idx on public.events (starts_at);
create index events_created_by_idx on public.events (created_by);

create table public.event_attendees (
  event_id uuid not null references public.events (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  primary key (event_id, profile_id)
);
create index event_attendees_profile_id_idx on public.event_attendees (profile_id);

-- ---------------------------------------------------------------------------
-- Operacional — Documentações de API (adquirentes)
-- ---------------------------------------------------------------------------
create table public.acquirers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(name) between 1 and 80),
  logo_path text,
  color text not null default '#2563eb' check (color ~ '^#[0-9a-fA-F]{6}$'),
  position double precision not null default 0,
  created_at timestamptz not null default now()
);

create table public.acquirer_documents (
  id uuid primary key default gen_random_uuid(),
  acquirer_id uuid not null references public.acquirers (id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check (length(file_name) between 1 and 255),
  size_bytes bigint not null check (size_bytes > 0),
  uploaded_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index acquirer_documents_acquirer_id_idx on public.acquirer_documents (acquirer_id);
create index acquirer_documents_uploaded_by_idx on public.acquirer_documents (uploaded_by);

create table public.acquirer_notes (
  id uuid primary key default gen_random_uuid(),
  acquirer_id uuid not null references public.acquirers (id) on delete cascade,
  title text not null default 'Sem título' check (length(title) <= 200),
  content text not null default '' check (length(content) <= 100000),
  updated_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index acquirer_notes_acquirer_id_idx on public.acquirer_notes (acquirer_id);
create index acquirer_notes_updated_by_idx on public.acquirer_notes (updated_by);
create trigger acquirer_notes_updated_at before update on public.acquirer_notes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Operacional — Cursos
-- ---------------------------------------------------------------------------
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 200),
  description text check (length(description) <= 5000),
  cover_path text,
  published boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index courses_created_by_idx on public.courses (created_by);

create table public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null check (length(title) between 1 and 200),
  position double precision not null default 0
);
create index course_modules_course_id_idx on public.course_modules (course_id, position);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules (id) on delete cascade,
  title text not null check (length(title) between 1 and 200),
  description text check (length(description) <= 10000),
  source public.video_source not null,
  video_path text,
  video_url text check (video_url ~ '^https://'),
  duration_seconds integer check (duration_seconds >= 0),
  position double precision not null default 0,
  check (
    (source = 'upload' and video_path is not null)
    or (source in ('drive', 'youtube') and video_url is not null)
  )
);
create index lessons_module_id_idx on public.lessons (module_id, position);

create table public.lesson_progress (
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  completed_at timestamptz not null default now(),
  primary key (lesson_id, profile_id)
);
create index lesson_progress_profile_id_idx on public.lesson_progress (profile_id);

-- ---------------------------------------------------------------------------
-- Comercial — Pipeline
-- ---------------------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 160),
  company_name text check (length(company_name) <= 200),
  email text check (length(email) <= 160),
  phone text check (length(phone) <= 30),
  source public.lead_source not null,
  referrer_name text check (length(referrer_name) <= 160),
  temperature public.lead_temperature not null,
  description text check (length(description) <= 5000),
  owner_id uuid references public.profiles (id) on delete set null,
  stage public.pipeline_stage not null default 'lead_recebido',
  position double precision not null default 0,
  deal_type public.deal_type,
  deal_value_cents bigint check (deal_value_cents > 0),
  lost_reason text check (length(lost_reason) <= 2000),
  closed_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (stage <> 'cliente_fechado' or (deal_type is not null and deal_value_cents is not null)),
  check (stage <> 'cliente_perdido' or (lost_reason is not null and length(trim(lost_reason)) > 0)),
  check (source <> 'indicacao' or referrer_name is not null)
);
create index leads_stage_idx on public.leads (stage, position);
create index leads_owner_id_idx on public.leads (owner_id);
create index leads_created_by_idx on public.leads (created_by);
create index leads_closed_at_idx on public.leads (closed_at) where closed_at is not null;
create trigger leads_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

alter table public.events
  add constraint events_lead_id_fkey foreign key (lead_id) references public.leads (id) on delete set null;
create index events_lead_id_idx on public.events (lead_id);

create table public.lead_stage_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  from_stage public.pipeline_stage,
  to_stage public.pipeline_stage not null,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_at timestamptz not null default now()
);
create index lead_stage_history_lead_id_idx on public.lead_stage_history (lead_id);
create index lead_stage_history_changed_by_idx on public.lead_stage_history (changed_by);

-- Mantém closed_at e o histórico de etapas coerentes, sem depender do cliente.
create or replace function public.track_lead_stage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.stage is distinct from old.stage then
    if new.stage in ('cliente_fechado', 'cliente_perdido') then
      new.closed_at = coalesce(new.closed_at, now());
    else
      new.closed_at = null;
    end if;
  end if;
  return new;
end;
$$;
create trigger leads_track_stage before insert or update on public.leads
  for each row execute function public.track_lead_stage();

create or replace function public.log_lead_stage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.stage is distinct from old.stage then
    insert into public.lead_stage_history (lead_id, from_stage, to_stage, changed_by)
    values (new.id, case when tg_op = 'UPDATE' then old.stage end, new.stage, (select auth.uid()));
  end if;
  return null;
end;
$$;
revoke execute on function public.track_lead_stage() from public, anon, authenticated;
revoke execute on function public.log_lead_stage() from public, anon, authenticated;
create trigger leads_log_stage after insert or update on public.leads
  for each row execute function public.log_lead_stage();

-- Desempenho por funcionário (respeita RLS de quem consulta).
create view public.seller_performance
with (security_invoker = true)
as
select
  p.id as profile_id,
  p.full_name,
  p.avatar_path,
  p.team_id,
  p.commission_rate,
  count(l.id) filter (where l.stage = 'cliente_fechado') as won_count,
  count(l.id) filter (where l.stage = 'cliente_perdido') as lost_count,
  coalesce(sum(l.deal_value_cents) filter (where l.stage = 'cliente_fechado'), 0)::bigint as revenue_cents,
  coalesce(round(sum(l.deal_value_cents) filter (where l.stage = 'cliente_fechado') * p.commission_rate / 100), 0)::bigint as commission_cents
from public.profiles p
left join public.leads l on l.owner_id = p.id
where p.active
group by p.id;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.teams enable row level security;
alter table public.profiles enable row level security;
alter table public.sales_goals enable row level security;
alter table public.clients enable row level security;
alter table public.companies enable row level security;
alter table public.company_ec_numbers enable row level security;
alter table public.company_bank_accounts enable row level security;
alter table public.company_documents enable row level security;
alter table public.boards enable row level security;
alter table public.board_lists enable row level security;
alter table public.labels enable row level security;
alter table public.cards enable row level security;
alter table public.card_labels enable row level security;
alter table public.card_assignees enable row level security;
alter table public.card_checklist_items enable row level security;
alter table public.events enable row level security;
alter table public.event_attendees enable row level security;
alter table public.acquirers enable row level security;
alter table public.acquirer_documents enable row level security;
alter table public.acquirer_notes enable row level security;
alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.leads enable row level security;
alter table public.lead_stage_history enable row level security;

-- Leitura para membros, escrita para gestores.
create policy teams_select on public.teams for select to authenticated using (public.is_member());
create policy teams_write on public.teams for all to authenticated
  using (public.is_manager()) with check (public.is_manager());

create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_member());
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy profiles_update_admin on public.profiles for update to authenticated
  using (public.has_role(array['admin']::public.app_role[]))
  with check (public.has_role(array['admin']::public.app_role[]));

create policy sales_goals_select on public.sales_goals for select to authenticated using (public.is_member());
create policy sales_goals_write on public.sales_goals for all to authenticated
  using (public.is_manager()) with check (public.is_manager());

create policy clients_select on public.clients for select to authenticated using (public.is_member());
create policy clients_write on public.clients for all to authenticated
  using (public.is_manager()) with check (public.is_manager());

create policy companies_select on public.companies for select to authenticated using (public.is_member());
create policy companies_write on public.companies for all to authenticated
  using (public.is_manager()) with check (public.is_manager());

create policy company_ec_select on public.company_ec_numbers for select to authenticated using (public.is_member());
create policy company_ec_write on public.company_ec_numbers for all to authenticated
  using (public.is_manager()) with check (public.is_manager());

-- Dados bancários e documentos: apenas gestores.
create policy company_bank_manager on public.company_bank_accounts for all to authenticated
  using (public.is_manager()) with check (public.is_manager());
create policy company_documents_manager on public.company_documents for all to authenticated
  using (public.is_manager()) with check (public.is_manager());

-- Missões: colaborativo entre membros.
create policy boards_member on public.boards for all to authenticated
  using (public.is_member()) with check (public.is_member());
create policy board_lists_member on public.board_lists for all to authenticated
  using (public.is_member()) with check (public.is_member());
create policy labels_member on public.labels for all to authenticated
  using (public.is_member()) with check (public.is_member());
create policy cards_member on public.cards for all to authenticated
  using (public.is_member()) with check (public.is_member());
create policy card_labels_member on public.card_labels for all to authenticated
  using (public.is_member()) with check (public.is_member());
create policy card_assignees_member on public.card_assignees for all to authenticated
  using (public.is_member()) with check (public.is_member());
create policy card_checklist_member on public.card_checklist_items for all to authenticated
  using (public.is_member()) with check (public.is_member());

-- Agenda: todos veem; criador ou gestor altera.
create policy events_select on public.events for select to authenticated using (public.is_member());
create policy events_insert on public.events for insert to authenticated
  with check (public.is_member() and created_by = (select auth.uid()));
create policy events_modify on public.events for update to authenticated
  using (public.is_member() and (created_by = (select auth.uid()) or public.is_manager()))
  with check (public.is_member());
create policy events_delete on public.events for delete to authenticated
  using (public.is_member() and (created_by = (select auth.uid()) or public.is_manager()));
create policy event_attendees_member on public.event_attendees for all to authenticated
  using (public.is_member()) with check (public.is_member());

-- Documentações de API.
create policy acquirers_select on public.acquirers for select to authenticated using (public.is_member());
create policy acquirers_write on public.acquirers for all to authenticated
  using (public.is_manager()) with check (public.is_manager());
create policy acquirer_documents_member on public.acquirer_documents for all to authenticated
  using (public.is_member()) with check (public.is_member());
create policy acquirer_notes_member on public.acquirer_notes for all to authenticated
  using (public.is_member()) with check (public.is_member());

-- Cursos: membros veem publicados; gestores gerenciam.
create policy courses_select on public.courses for select to authenticated
  using (public.is_member() and (published or public.is_manager()));
create policy courses_write on public.courses for all to authenticated
  using (public.is_manager()) with check (public.is_manager());
create policy course_modules_select on public.course_modules for select to authenticated
  using (public.is_member() and exists (
    select 1 from public.courses c where c.id = course_id and (c.published or public.is_manager())
  ));
create policy course_modules_write on public.course_modules for all to authenticated
  using (public.is_manager()) with check (public.is_manager());
create policy lessons_select on public.lessons for select to authenticated
  using (public.is_member() and exists (
    select 1 from public.course_modules m join public.courses c on c.id = m.course_id
    where m.id = module_id and (c.published or public.is_manager())
  ));
create policy lessons_write on public.lessons for all to authenticated
  using (public.is_manager()) with check (public.is_manager());
create policy lesson_progress_own on public.lesson_progress for all to authenticated
  using (profile_id = (select auth.uid()) and public.is_member())
  with check (profile_id = (select auth.uid()) and public.is_member());

-- Pipeline: todos veem (ranking/insights); dono, criador ou gestor altera.
create policy leads_select on public.leads for select to authenticated using (public.is_member());
create policy leads_insert on public.leads for insert to authenticated
  with check (public.is_member() and created_by = (select auth.uid()));
create policy leads_update on public.leads for update to authenticated
  using (public.is_member() and (
    owner_id = (select auth.uid()) or created_by = (select auth.uid()) or public.is_manager()
  ))
  with check (public.is_member());
create policy leads_delete on public.leads for delete to authenticated
  using (public.is_manager());
create policy lead_stage_history_select on public.lead_stage_history for select to authenticated
  using (public.is_member());

-- ---------------------------------------------------------------------------
-- Storage (buckets privados; acesso por URL assinada)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('company-docs', 'company-docs', false, 20971520, array['application/pdf']),
  ('acquirer-docs', 'acquirer-docs', false, 52428800, null),
  ('course-videos', 'course-videos', false, 52428800, array['video/mp4', 'video/webm', 'video/quicktime']),
  ('avatars', 'avatars', false, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('acquirer-logos', 'acquirer-logos', false, 2097152, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

create policy storage_company_docs on storage.objects for all to authenticated
  using (bucket_id = 'company-docs' and public.is_manager())
  with check (bucket_id = 'company-docs' and public.is_manager());

create policy storage_acquirer_docs on storage.objects for all to authenticated
  using (bucket_id = 'acquirer-docs' and public.is_member())
  with check (bucket_id = 'acquirer-docs' and public.is_member());

create policy storage_course_videos_read on storage.objects for select to authenticated
  using (bucket_id = 'course-videos' and public.is_member());
create policy storage_course_videos_write on storage.objects for insert to authenticated
  with check (bucket_id = 'course-videos' and public.is_manager());
create policy storage_course_videos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'course-videos' and public.is_manager());

create policy storage_avatars_read on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and public.is_member());
-- Cada usuário grava apenas em avatars/<seu-id>/...; admin grava em qualquer pasta.
create policy storage_avatars_write on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and public.is_member() and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or public.has_role(array['admin']::public.app_role[])
  ));
create policy storage_avatars_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and public.is_member() and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or public.has_role(array['admin']::public.app_role[])
  ));

create policy storage_acquirer_logos_read on storage.objects for select to authenticated
  using (bucket_id = 'acquirer-logos' and public.is_member());
create policy storage_acquirer_logos_write on storage.objects for insert to authenticated
  with check (bucket_id = 'acquirer-logos' and public.is_manager());
create policy storage_acquirer_logos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'acquirer-logos' and public.is_manager());
