-- O repositório é público: "o primeiro usuário vira admin" permitiria que qualquer
-- pessoa com a URL do projeto se cadastrasse antes do dono. Agora só e-mails da
-- lista privada (preenchida direto no banco, fora do repositório) viram admin, e
-- somente depois de confirmar o e-mail.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.bootstrap_admins (
  email text primary key check (email = lower(email))
);
revoke all on private.bootstrap_admins from public, anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invited boolean := coalesce((new.raw_app_meta_data ->> 'cronos_invited')::boolean, false);
  invited_role public.app_role := coalesce(
    nullif(new.raw_app_meta_data ->> 'cronos_role', '')::public.app_role,
    'funcionario'
  );
begin
  insert into public.profiles (id, email, full_name, role, active)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when invited then invited_role else 'funcionario' end,
    invited
  );
  perform public.promote_bootstrap_admin(new.id, new.email, new.email_confirmed_at);
  return new;
end;
$$;

create or replace function public.promote_bootstrap_admin(user_id uuid, user_email text, confirmed_at timestamptz)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if confirmed_at is null or user_email is null then
    return;
  end if;
  if exists (select 1 from private.bootstrap_admins b where b.email = lower(user_email)) then
    update public.profiles set role = 'admin', active = true where id = user_id;
  end if;
end;
$$;
revoke execute on function public.promote_bootstrap_admin(uuid, text, timestamptz) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create or replace function public.handle_user_confirmed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    perform public.promote_bootstrap_admin(new.id, new.email, new.email_confirmed_at);
  end if;
  return new;
end;
$$;
revoke execute on function public.handle_user_confirmed() from public, anon, authenticated;

create trigger on_auth_user_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function public.handle_user_confirmed();

-- /primeiro-acesso fica disponível enquanto não houver admin ativo.
create or replace function public.cronos_needs_setup()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (select 1 from public.profiles where role = 'admin' and active);
$$;
