-- FinFlow — migração: adiciona multiusuário a um banco que já existia
--
-- Use este script SÓ SE você já rodou uma versão antiga do schema.sql
-- (sem a coluna user_id) e quer corrigir sem apagar os dados.
-- Se ainda não rodou nada, ignore este arquivo e use só o schema.sql.
--
-- ⚠️ Antes de rodar: os dados que já existirem vão precisar de um dono.
-- Troque 'SEU-USER-ID-AQUI' pelo UUID de um usuário real (veja em
-- Authentication > Users no painel do Supabase, ou crie uma conta pelo
-- app primeiro) — ou apague os dados de teste antes, se preferir começar
-- do zero.

do $$
declare
  default_owner uuid := 'SEU-USER-ID-AQUI'; -- <- troque aqui
begin
  alter table public.cards add column if not exists user_id uuid;
  alter table public.transactions add column if not exists user_id uuid;
  alter table public.invoices add column if not exists user_id uuid;
  alter table public.budgets add column if not exists user_id uuid;
  alter table public.goals add column if not exists user_id uuid;
  alter table public.investments add column if not exists user_id uuid;

  update public.cards set user_id = default_owner where user_id is null;
  update public.transactions set user_id = default_owner where user_id is null;
  update public.invoices set user_id = default_owner where user_id is null;
  update public.budgets set user_id = default_owner where user_id is null;
  update public.goals set user_id = default_owner where user_id is null;
  update public.investments set user_id = default_owner where user_id is null;
end $$;

alter table public.cards
  alter column user_id set not null,
  alter column user_id set default auth.uid(),
  add constraint cards_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.transactions
  alter column user_id set not null,
  alter column user_id set default auth.uid(),
  add constraint transactions_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.invoices
  alter column user_id set not null,
  alter column user_id set default auth.uid(),
  add constraint invoices_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.budgets
  alter column user_id set not null,
  alter column user_id set default auth.uid(),
  add constraint budgets_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.goals
  alter column user_id set not null,
  alter column user_id set default auth.uid(),
  add constraint goals_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.investments
  alter column user_id set not null,
  alter column user_id set default auth.uid(),
  add constraint investments_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade;

create index if not exists cards_user_id_idx on public.cards (user_id);
create index if not exists transactions_user_id_idx on public.transactions (user_id);
create index if not exists invoices_user_id_idx on public.invoices (user_id);
create index if not exists budgets_user_id_idx on public.budgets (user_id);
create index if not exists goals_user_id_idx on public.goals (user_id);
create index if not exists investments_user_id_idx on public.investments (user_id);

-- troca as policies antigas ("público total") pelas novas (por usuário)
drop policy if exists "public full access" on public.cards;
drop policy if exists "public full access" on public.transactions;
drop policy if exists "public full access" on public.invoices;
drop policy if exists "public full access" on public.budgets;
drop policy if exists "public full access" on public.goals;
drop policy if exists "public full access" on public.investments;

create policy "own rows" on public.cards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.invoices for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.budgets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.investments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
