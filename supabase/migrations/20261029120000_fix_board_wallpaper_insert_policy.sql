-- Corrige o insert de imagem de fundo do quadro (bucket wallpapers, pasta boards/).
-- A policy anterior (20261027180000) escrevia `storage.foldername(name)` dentro do
-- subquery `from public.boards b`, onde `name` sem qualificar liga na coluna
-- boards.name (o título do quadro), não no name do objeto do Storage. Com isso o
-- EXISTS nunca batia e todo upload de fundo de quadro era negado (42501 RLS).
-- Qualifica o name do objeto com storage.objects.name (referência correlacionada ao
-- row externo) para comparar com o board_id da pasta boards/<board_id>/.

drop policy if exists storage_wallpapers_insert on storage.objects;
create policy storage_wallpapers_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'wallpapers' and public.is_member() and (
      ((storage.foldername(name))[1] = 'users' and (storage.foldername(name))[2] = (select auth.uid())::text)
      or ((storage.foldername(name))[1] = 'boards'
          and exists (select 1 from public.boards b where b.id::text = (storage.foldername(storage.objects.name))[2]))
    )
  );
