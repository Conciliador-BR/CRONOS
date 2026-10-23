-- CRONOS — endurecimento de segurança (revisão de banco, fase 1).
-- Aditiva: não altera dados; ajusta privilégios, um trigger e políticas.
-- Detalhes e evidências: docs/security.md.

-- ---------------------------------------------------------------------------
-- S-01 Privilégios mínimos: anon não precisa de tabela nenhuma (o app só usa
-- anon para Auth e para a RPC cronos_needs_setup). TRUNCATE/REFERENCES/TRIGGER
-- ignoram RLS e não são usados pela API; saem de anon e authenticated.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;

alter default privileges for role postgres in schema public
  revoke all on tables from anon;
alter default privileges for role postgres in schema public
  revoke truncate, references, trigger on tables from authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon;

-- Funções de trigger não devem ser chamáveis por ninguém da API.
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.guard_profile_update() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- S-02 Leads: quem não é gestor não reescreve autoria nem datas.
-- Antes: o dono/criador podia trocar created_by (passar o lead para outra
-- pessoa como "criador"), retroagir created_at e escolher closed_at, o que
-- distorce ranking, comissão por período e insights.
-- Agora: created_by/created_at imutáveis para não gestores; closed_at é sempre
-- now() na transição para fechado/perdido e não muda fora de transição.
-- Gestor, admin e service role (auth.uid() nulo) mantêm o comportamento antigo
-- (permite importar histórico). Deixa de ser security definer: não precisa.
-- ---------------------------------------------------------------------------
create or replace function public.track_lead_stage()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  privileged boolean := (select auth.uid()) is null or public.is_manager();
begin
  if tg_op = 'INSERT' then
    if not privileged then
      new.created_at = now();
    end if;
  elsif not privileged and (
    new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at
  ) then
    raise exception 'Somente gestores alteram o criador ou a data de criação do lead'
      using errcode = '42501';
  end if;

  if tg_op = 'INSERT' or new.stage is distinct from old.stage then
    if new.stage in ('cliente_fechado', 'cliente_perdido') then
      new.closed_at = case when privileged then coalesce(new.closed_at, now()) else now() end;
    else
      new.closed_at = null;
    end if;
  elsif not privileged then
    new.closed_at = old.closed_at;
  end if;
  return new;
end;
$$;
revoke execute on function public.track_lead_stage() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- S-03 Agenda: o criador não pode "doar" o evento (created_by) a outra pessoa.
-- ---------------------------------------------------------------------------
alter policy events_modify on public.events
  using (public.is_member() and (created_by = (select auth.uid()) or public.is_manager()))
  with check (public.is_member() and (created_by = (select auth.uid()) or public.is_manager()));

-- ---------------------------------------------------------------------------
-- S-04 Participantes: antes qualquer membro incluía/removia participantes de
-- qualquer evento. Agora: todos leem; criador do evento ou gestor gerencia;
-- cada pessoa pode sair de um evento (apagar a própria participação).
-- ---------------------------------------------------------------------------
-- Sem DROP: a política "for all" existente passa a exigir criador/gestor, e
-- políticas permissivas novas devolvem a leitura a todos e a saída a cada um.
alter policy event_attendees_member on public.event_attendees
  using (public.is_member() and exists (
    select 1 from public.events e
    where e.id = event_id and (e.created_by = (select auth.uid()) or public.is_manager())
  ))
  with check (public.is_member() and exists (
    select 1 from public.events e
    where e.id = event_id and (e.created_by = (select auth.uid()) or public.is_manager())
  ));
comment on policy event_attendees_member on public.event_attendees is
  'Gerenciar participantes: criador do evento ou gestor (ver 20261023200000_security_hardening).';

create policy event_attendees_select on public.event_attendees for select to authenticated
  using (public.is_member());
create policy event_attendees_leave on public.event_attendees for delete to authenticated
  using (public.is_member() and profile_id = (select auth.uid()));
