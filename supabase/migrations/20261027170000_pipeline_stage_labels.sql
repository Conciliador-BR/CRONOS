-- Nomes das etapas do pipeline editáveis por admin/gestor. A etapa (enum) continua a chave;
-- só o rótulo exibido muda, então regras de fechado/perdido, histórico e relatórios seguem iguais.

create table public.pipeline_stage_labels (
  stage public.pipeline_stage primary key,
  label text not null check (length(btrim(label)) between 1 and 40),
  updated_by uuid references public.profiles (id) on delete set null default auth.uid(),
  updated_at timestamptz not null default now()
);
create index pipeline_stage_labels_updated_by_idx on public.pipeline_stage_labels (updated_by);

create trigger pipeline_stage_labels_updated_at before update on public.pipeline_stage_labels
  for each row execute function public.set_updated_at();

insert into public.pipeline_stage_labels (stage, label) values
  ('lead_recebido', 'Lead recebido'),
  ('diagnostico_feito', 'Diagnóstico feito'),
  ('reuniao_marcada', 'Reunião marcada'),
  ('follow_up', 'Follow up'),
  ('cliente_fechado', 'Cliente fechado'),
  ('cliente_perdido', 'Cliente perdido');

alter table public.pipeline_stage_labels enable row level security;
create policy pipeline_stage_labels_select on public.pipeline_stage_labels for select to authenticated
  using (public.is_member());
create policy pipeline_stage_labels_update on public.pipeline_stage_labels for update to authenticated
  using (public.is_manager()) with check (public.is_manager());

-- As seis etapas são fixas: ninguém insere nem apaga linhas pela API.
revoke insert, delete on public.pipeline_stage_labels from authenticated;
