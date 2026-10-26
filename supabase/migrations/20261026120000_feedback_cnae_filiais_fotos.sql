-- Feedback 26/10: CNAE, filiais (matriz/filial), coordenadas do mercado no mapa e fotos nos cartões.

-- Empresas ------------------------------------------------------------------
alter table public.companies
  add column cnae char(7) check (cnae ~ '^[0-9]{7}$'),
  add column cnae_description text check (length(cnae_description) <= 200),
  add column parent_company_id uuid references public.companies (id) on delete set null,
  add column latitude numeric(9, 6) check (latitude between -90 and 90),
  add column longitude numeric(9, 6) check (longitude between -180 and 180),
  add constraint companies_parent_not_self check (parent_company_id is null or parent_company_id <> id),
  add constraint companies_coords_pair check ((latitude is null) = (longitude is null));

create index companies_parent_company_id_idx on public.companies (parent_company_id);

-- Só um nível: a matriz não pode ser filial, e uma empresa com filiais não vira filial.
create or replace function public.check_company_parent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.parent_company_id is not null then
    if exists (select 1 from public.companies p where p.id = new.parent_company_id and p.parent_company_id is not null) then
      raise exception 'A matriz escolhida já é filial de outra empresa.' using errcode = '23514';
    end if;
    if exists (select 1 from public.companies c where c.parent_company_id = new.id) then
      raise exception 'Empresa com filiais não pode virar filial.' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.check_company_parent() from public, anon, authenticated;

create trigger companies_check_parent before insert or update of parent_company_id on public.companies
  for each row execute function public.check_company_parent();

-- Fotos dos cartões ---------------------------------------------------------
create table public.card_attachments (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards (id) on delete cascade,
  storage_path text not null unique check (length(storage_path) between 1 and 300),
  file_name text not null check (length(file_name) between 1 and 200),
  mime_type text not null check (mime_type in ('image/png', 'image/jpeg', 'image/webp')),
  size_bytes integer not null check (size_bytes between 1 and 10485760),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index card_attachments_card_id_idx on public.card_attachments (card_id);
create index card_attachments_created_by_idx on public.card_attachments (created_by);

alter table public.card_attachments enable row level security;
create policy card_attachments_select on public.card_attachments for select to authenticated
  using (public.is_member());
create policy card_attachments_insert on public.card_attachments for insert to authenticated
  with check (public.is_member() and created_by = (select auth.uid()));
create policy card_attachments_delete on public.card_attachments for delete to authenticated
  using (public.is_member() and (created_by = (select auth.uid()) or public.is_manager()));

revoke update on public.card_attachments from authenticated;

-- Capa do cartão (opcional): uma das fotos anexadas.
alter table public.cards
  add column cover_attachment_id uuid references public.card_attachments (id) on delete set null;
create index cards_cover_attachment_id_idx on public.cards (cover_attachment_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('card-images', 'card-images', false, 10485760, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy storage_card_images_read on storage.objects for select to authenticated
  using (bucket_id = 'card-images' and public.is_member());
create policy storage_card_images_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'card-images' and public.is_member());
create policy storage_card_images_delete on storage.objects for delete to authenticated
  using (bucket_id = 'card-images' and public.is_member() and (owner_id = (select auth.uid())::text or public.is_manager()));
