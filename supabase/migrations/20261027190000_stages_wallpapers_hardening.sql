-- Revisão de segurança da 20261027180000:
-- S4-01: papel de parede pessoal (users/<id>/) só é lido pelo próprio usuário; fundos de quadro seguem para todos.
-- S4-03: excluir etapa move os leads e apaga a coluna numa única transação.

alter policy storage_wallpapers_read on storage.objects
  using (
    bucket_id = 'wallpapers' and public.is_member() and (
      ((storage.foldername(name))[1] = 'users' and (storage.foldername(name))[2] = (select auth.uid())::text)
      or (storage.foldername(name))[1] = 'boards'
    )
  );

create or replace function public.delete_pipeline_stage(p_stage_id uuid, p_move_to uuid default null)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  moved integer := 0;
begin
  if not public.is_manager() then
    raise exception 'Somente admin ou gestor exclui etapas.' using errcode = '42501';
  end if;
  if p_move_to is not null then
    if p_move_to = p_stage_id
       or not exists (select 1 from public.pipeline_stages s where s.id = p_move_to and s.kind = 'aberto') then
      raise exception 'Escolha outra etapa aberta para receber os leads.' using errcode = '23514';
    end if;
    update public.leads set stage_id = p_move_to where stage_id = p_stage_id;
    get diagnostics moved = row_count;
  end if;
  delete from public.pipeline_stages where id = p_stage_id;
  if not found then
    raise exception 'Etapa não encontrada.' using errcode = 'P0002';
  end if;
  return moved;
end;
$$;
revoke execute on function public.delete_pipeline_stage(uuid, uuid) from public, anon;
grant execute on function public.delete_pipeline_stage(uuid, uuid) to authenticated;
