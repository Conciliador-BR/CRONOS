-- Posição vertical da capa da lista (0 = topo da foto, 100 = base), para enquadrar
-- rostos que o corte em object-fit: cover esconderia. 50 = centro (padrão do CSS).

alter table public.board_lists
  add column cover_position smallint not null default 50
    constraint board_lists_cover_position_check check (cover_position between 0 and 100);
