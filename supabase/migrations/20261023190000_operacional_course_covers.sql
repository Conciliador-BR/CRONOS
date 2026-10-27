-- Operacional · Cursos: bucket privado para capas de curso (imagens até 2 MB).
-- Membros leem (URL assinada); só gestores enviam ou removem.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('course-covers', 'course-covers', false, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy storage_course_covers_read on storage.objects for select to authenticated
  using (bucket_id = 'course-covers' and public.is_member());
create policy storage_course_covers_write on storage.objects for insert to authenticated
  with check (bucket_id = 'course-covers' and public.is_manager());
create policy storage_course_covers_delete on storage.objects for delete to authenticated
  using (bucket_id = 'course-covers' and public.is_manager());
