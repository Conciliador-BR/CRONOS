-- Número da filial (02, 03, 04…) escolhido no cadastro da empresa. Matriz = null.
-- Preenche as filiais existentes com o número de ordem do CNPJ (dígitos 9 a 12: /0002 = filial 02).

alter table public.companies
  add column branch_number smallint
  constraint companies_branch_number_check
    check (branch_number is null or (parent_company_id is not null and branch_number between 2 and 9999));

update public.companies
set branch_number = substring(regexp_replace(cnpj, '\D', '', 'g') from 9 for 4)::smallint
where parent_company_id is not null
  and substring(regexp_replace(cnpj, '\D', '', 'g') from 9 for 4) ~ '^\d{4}$'
  and substring(regexp_replace(cnpj, '\D', '', 'g') from 9 for 4)::int between 2 and 9999;

-- Ao virar matriz, o número some (senão o check bloquearia a edição).
create or replace function public.companies_clear_branch_number()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.parent_company_id is null then
    new.branch_number := null;
  end if;
  return new;
end;
$$;

create trigger companies_clear_branch_number
  before insert or update of parent_company_id, branch_number on public.companies
  for each row execute function public.companies_clear_branch_number();
