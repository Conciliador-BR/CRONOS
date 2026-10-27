-- 1) Etapas do pipeline viram linhas (criar, excluir, reordenar e renomear).
--    O enum leads.stage continua existindo como "tipo" derivado da coluna: cliente_fechado e
--    cliente_perdido mantêm os checks, closed_at, o histórico e a view seller_performance.
-- 2) Imagens de fundo nas Missões: papel de parede por usuário e imagem por quadro.

-- Etapas -----------------------------------------------------------------------
create table public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  label text not null check (length(btrim(label)) between 1 and 40),
  position double precision not null default 0,
  kind text not null default 'aberto' check (kind in ('aberto', 'fechado', 'perdido')),
  -- Etapa original do enum (as seis iniciais); colunas novas ficam null.
  legacy_stage public.pipeline_stage unique,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Uma única coluna de "fechado" e uma de "perdido".
create unique index pipeline_stages_terminal_kind_key on public.pipeline_stages (kind) where kind <> 'aberto';
create index pipeline_stages_position_idx on public.pipeline_stages (position);
create index pipeline_stages_created_by_idx on public.pipeline_stages (created_by);
create trigger pipeline_stages_updated_at before update on public.pipeline_stages
  for each row execute function public.set_updated_at();

insert into public.pipeline_stages (label, position, kind, legacy_stage)
select coalesce(l.label, d.label), d.position, d.kind, d.stage
from (values
  ('lead_recebido'::public.pipeline_stage, 'Lead recebido', 1, 'aberto'),
  ('diagnostico_feito', 'Diagnóstico feito', 2, 'aberto'),
  ('reuniao_marcada', 'Reunião marcada', 3, 'aberto'),
  ('follow_up', 'Follow up', 4, 'aberto'),
  ('cliente_fechado', 'Cliente fechado', 5, 'fechado'),
  ('cliente_perdido', 'Cliente perdido', 6, 'perdido')
) as d (stage, label, position, kind)
left join public.pipeline_stage_labels l on l.stage = d.stage;

comment on table public.pipeline_stage_labels is
  'Obsoleta desde 20261027180000: os nomes ficam em pipeline_stages.label.';

-- Não deixa o pipeline sem nenhuma etapa aberta (lead novo precisa de uma).
create or replace function public.guard_pipeline_stage_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.kind <> 'aberto' then
    raise exception 'As etapas de fechado e perdido não podem ser excluídas.' using errcode = '23514';
  end if;
  if not exists (select 1 from public.pipeline_stages s where s.kind = 'aberto' and s.id <> old.id) then
    raise exception 'O pipeline precisa de pelo menos uma etapa aberta.' using errcode = '23514';
  end if;
  return old;
end;
$$;
revoke execute on function public.guard_pipeline_stage_delete() from public, anon, authenticated;
create trigger pipeline_stages_guard_delete before delete on public.pipeline_stages
  for each row execute function public.guard_pipeline_stage_delete();

-- O tipo de uma coluna não muda depois de criada (evita trocar fechado/perdido de lugar).
create or replace function public.guard_pipeline_stage_kind()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.kind is distinct from old.kind or new.legacy_stage is distinct from old.legacy_stage then
    raise exception 'O tipo da etapa não pode ser alterado.' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke execute on function public.guard_pipeline_stage_kind() from public, anon, authenticated;
create trigger pipeline_stages_guard_kind before update on public.pipeline_stages
  for each row execute function public.guard_pipeline_stage_kind();

alter table public.pipeline_stages enable row level security;
create policy pipeline_stages_select on public.pipeline_stages for select to authenticated
  using (public.is_member());
create policy pipeline_stages_insert on public.pipeline_stages for insert to authenticated
  with check (public.is_manager() and kind = 'aberto' and legacy_stage is null);
create policy pipeline_stages_update on public.pipeline_stages for update to authenticated
  using (public.is_manager()) with check (public.is_manager());
create policy pipeline_stages_delete on public.pipeline_stages for delete to authenticated
  using (public.is_manager() and kind = 'aberto');

-- Leads apontam para a coluna --------------------------------------------------
alter table public.leads add column stage_id uuid references public.pipeline_stages (id) on delete restrict;
update public.leads l set stage_id = s.id from public.pipeline_stages s where s.legacy_stage = l.stage;
alter table public.leads alter column stage_id set not null;
create index leads_stage_id_position_idx on public.leads (stage_id, position);

-- Mantém stage_id e o enum stage coerentes. Roda antes de leads_track_stage (ordem alfabética).
create or replace function public.sync_lead_stage()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  col public.pipeline_stages%rowtype;
begin
  if tg_op = 'UPDATE' and new.stage_id is not distinct from old.stage_id and new.stage is distinct from old.stage then
    -- Código antigo mudou só o enum: acha a coluna correspondente.
    new.stage_id = null;
  end if;

  if new.stage_id is null then
    select * into col from public.pipeline_stages s
    where s.legacy_stage = new.stage
       or (new.stage = 'cliente_fechado' and s.kind = 'fechado')
       or (new.stage = 'cliente_perdido' and s.kind = 'perdido')
    order by (s.legacy_stage = new.stage) desc nulls last
    limit 1;
    if not found then
      select * into col from public.pipeline_stages s where s.kind = 'aberto' order by s.position limit 1;
    end if;
    new.stage_id = col.id;
  else
    select * into col from public.pipeline_stages s where s.id = new.stage_id;
  end if;

  new.stage = case col.kind
    when 'fechado' then 'cliente_fechado'::public.pipeline_stage
    when 'perdido' then 'cliente_perdido'::public.pipeline_stage
    else coalesce(col.legacy_stage, 'lead_recebido'::public.pipeline_stage)
  end;
  return new;
end;
$$;
revoke execute on function public.sync_lead_stage() from public, anon, authenticated;
create trigger leads_sync_stage before insert or update of stage, stage_id on public.leads
  for each row execute function public.sync_lead_stage();

-- Histórico guarda a coluna (inclusive as criadas depois).
alter table public.lead_stage_history
  add column from_stage_id uuid references public.pipeline_stages (id) on delete set null,
  add column to_stage_id uuid references public.pipeline_stages (id) on delete set null;
create index lead_stage_history_from_stage_id_idx on public.lead_stage_history (from_stage_id);
create index lead_stage_history_to_stage_id_idx on public.lead_stage_history (to_stage_id);
update public.lead_stage_history h set to_stage_id = s.id from public.pipeline_stages s where s.legacy_stage = h.to_stage;
update public.lead_stage_history h set from_stage_id = s.id from public.pipeline_stages s where s.legacy_stage = h.from_stage;

create or replace function public.log_lead_stage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.stage_id is distinct from old.stage_id then
    insert into public.lead_stage_history (lead_id, from_stage, to_stage, from_stage_id, to_stage_id, changed_by)
    values (
      new.id,
      case when tg_op = 'UPDATE' then old.stage end,
      new.stage,
      case when tg_op = 'UPDATE' then old.stage_id end,
      new.stage_id,
      (select auth.uid())
    );
  end if;
  return null;
end;
$$;
revoke execute on function public.log_lead_stage() from public, anon, authenticated;

-- Fundos nas Missões --------------------------------------------------------------
alter table public.boards
  add column background_image_path text check (length(background_image_path) between 1 and 300);

create table public.user_preferences (
  profile_id uuid primary key references public.profiles (id) on delete cascade default auth.uid(),
  missions_wallpaper_path text check (length(missions_wallpaper_path) between 1 and 300),
  updated_at timestamptz not null default now()
);
create trigger user_preferences_updated_at before update on public.user_preferences
  for each row execute function public.set_updated_at();
alter table public.user_preferences enable row level security;
create policy user_preferences_own on public.user_preferences for all to authenticated
  using (public.is_member() and profile_id = (select auth.uid()))
  with check (public.is_member() and profile_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('wallpapers', 'wallpapers', false, 10485760, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

-- Caminhos: users/<auth.uid>/<arquivo> (papel de parede) e boards/<board_id>/<arquivo> (fundo do quadro).
create policy storage_wallpapers_read on storage.objects for select to authenticated
  using (bucket_id = 'wallpapers' and public.is_member());
create policy storage_wallpapers_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'wallpapers' and public.is_member() and (
      ((storage.foldername(name))[1] = 'users' and (storage.foldername(name))[2] = (select auth.uid())::text)
      or ((storage.foldername(name))[1] = 'boards'
          and exists (select 1 from public.boards b where b.id::text = (storage.foldername(name))[2]))
    )
  );
create policy storage_wallpapers_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'wallpapers' and public.is_member() and (
      ((storage.foldername(name))[1] = 'users' and (storage.foldername(name))[2] = (select auth.uid())::text)
      or ((storage.foldername(name))[1] = 'boards' and (owner_id = (select auth.uid())::text or public.is_manager()))
    )
  );
