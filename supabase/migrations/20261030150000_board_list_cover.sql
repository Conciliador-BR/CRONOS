-- Capa no topo de cada lista das Missões. Imagem no bucket wallpapers, em boards/<board_id>/lists/
-- (as policies existentes do bucket já liberam a pasta boards/ do quadro para membros).

alter table public.board_lists
  add column cover_path text
    constraint board_lists_cover_path_check check (cover_path is null or char_length(cover_path) <= 400);
