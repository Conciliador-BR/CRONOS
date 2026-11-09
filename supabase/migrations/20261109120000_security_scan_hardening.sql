-- Varredura de segurança (2026-11-09). Ver docs/security.md, seção "Varredura 2026-11-09".

-- ---------------------------------------------------------------------------
-- V-01 Documentações: arquivos de adquirentes.
-- Antes: `for all` com is_member() deixava qualquer membro sobrescrever (upsert/move)
-- ou apagar, direto pela API, o arquivo enviado por outra pessoa, sem rastro.
-- Agora: membros leem e enviam; ninguém sobrescreve; apaga só quem enviou ou gestor.
-- ---------------------------------------------------------------------------
drop policy if exists storage_acquirer_docs on storage.objects;

create policy storage_acquirer_docs_select on storage.objects for select to authenticated
  using (bucket_id = 'acquirer-docs' and public.is_member());
create policy storage_acquirer_docs_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'acquirer-docs' and public.is_member());
create policy storage_acquirer_docs_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'acquirer-docs'
    and public.is_member()
    and (owner_id = (select auth.uid())::text or public.is_manager())
  );

drop policy if exists acquirer_documents_member on public.acquirer_documents;

create policy acquirer_documents_select on public.acquirer_documents for select to authenticated
  using (public.is_member());
create policy acquirer_documents_insert on public.acquirer_documents for insert to authenticated
  with check (public.is_member() and uploaded_by = (select auth.uid()));
create policy acquirer_documents_delete on public.acquirer_documents for delete to authenticated
  using (public.is_member() and (uploaded_by = (select auth.uid()) or public.is_manager()));

drop policy if exists acquirer_progress_files_delete on public.acquirer_progress_files;
create policy acquirer_progress_files_delete on public.acquirer_progress_files for delete to authenticated
  using (public.is_member() and (uploaded_by = (select auth.uid()) or public.is_manager()));

-- ---------------------------------------------------------------------------
-- V-02 Bootstrap do dono: a entrada da lista vale uma vez só.
-- Antes: a linha em private.bootstrap_admins ficava para sempre; se a conta do dono
-- fosse apagada (ou a confirmação de e-mail estivesse desligada), quem se cadastrasse
-- com aquele e-mail viraria admin.
-- ---------------------------------------------------------------------------
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
  delete from private.bootstrap_admins b where b.email = lower(user_email);
  if found then
    update public.profiles set role = 'admin', active = true where id = user_id;
  end if;
end;
$$;
revoke execute on function public.promote_bootstrap_admin(uuid, text, timestamptz) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- V-03 Um admin não rebaixa nem desativa outro admin.
-- Antes: um admin comprometido tirava o papel ou desativava o dono e tomava o sistema.
-- Agora: papel e status de um admin só mudam pelo painel/SQL (service role, auth.uid() nulo).
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return new;
  end if;
  if old.role = 'admin' and old.id <> (select auth.uid())
     and (new.role is distinct from old.role or new.active is distinct from old.active) then
    raise exception 'O papel e o acesso de outro administrador não podem ser alterados'
      using errcode = '42501';
  end if;
  if public.has_role(array['admin']::public.app_role[]) then
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
revoke execute on function public.guard_profile_update() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- V-04 Funções de trigger sem revoke (regra de docs/security.md).
-- ---------------------------------------------------------------------------
revoke execute on function public.companies_clear_branch_number() from public, anon, authenticated;
revoke execute on function public.acquirer_company_progress_touch() from public, anon, authenticated;
