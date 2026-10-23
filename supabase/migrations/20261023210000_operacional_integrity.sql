-- Revisão de segurança fase 2b (docs/security.md P2b-01..03).

-- P2b-01: cartão sempre na lista do próprio quadro; etiqueta do mesmo quadro do cartão.
alter table public.board_lists add constraint board_lists_id_board_key unique (id, board_id);
alter table public.cards add constraint cards_list_board_fkey
  foreign key (list_id, board_id) references public.board_lists (id, board_id) on delete cascade;

create or replace function public.check_card_label_board()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.cards c join public.labels l on l.board_id = c.board_id
    where c.id = new.card_id and l.id = new.label_id
  ) then
    raise exception 'Etiqueta e cartão precisam ser do mesmo quadro';
  end if;
  return new;
end;
$$;
revoke execute on function public.check_card_label_board() from public, anon, authenticated;

create trigger card_labels_same_board before insert or update on public.card_labels
  for each row execute function public.check_card_label_board();

-- P2b-02: documentos de adquirentes só em formatos de documento/imagem comuns.
update storage.buckets set allowed_mime_types = array[
  'application/pdf', 'text/plain', 'text/csv', 'application/json', 'application/zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword', 'application/vnd.ms-excel',
  'image/png', 'image/jpeg', 'image/webp'
] where id = 'acquirer-docs';

-- P2b-03: logos sem SVG.
update storage.buckets set allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
where id = 'acquirer-logos';
