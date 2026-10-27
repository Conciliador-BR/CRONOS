-- Indica se o sistema ainda não tem nenhum usuário (libera /primeiro-acesso).
-- security definer: anon não lê profiles por RLS, mas pode saber se a tabela está vazia.
create or replace function public.cronos_needs_setup()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (select 1 from public.profiles);
$$;

revoke execute on function public.cronos_needs_setup() from public;
grant execute on function public.cronos_needs_setup() to anon, authenticated;
