-- FinFlow — schema Supabase (multiusuário)
-- Rode este script inteiro no SQL Editor do seu projeto Supabase
-- (Project > SQL Editor > New query > cole e clique em "Run").
--
-- Cada tabela tem uma coluna user_id que referencia auth.users e a RLS
-- garante que cada pessoa só vê/edita os próprios dados. O valor padrão
-- de user_id é auth.uid(), então o app (lib/storage.js) nem precisa
-- enviar esse campo — ele é preenchido sozinho a partir do usuário logado.

create table if not exists public.cards (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  brand text,
  "limit" numeric not null default 0,
  closing_day integer,
  due_day integer,
  color text,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null check (type in ('entrada', 'saida')),
  description text not null,
  category text,
  amount numeric not null default 0,
  date date not null,
  card_id text references public.cards (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_id text references public.cards (id) on delete cascade,
  month text not null,
  status text not null default 'aberta',
  created_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category text not null,
  "limit" numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  target numeric not null default 0,
  current numeric not null default 0,
  deadline date,
  created_at timestamptz not null default now()
);

create table if not exists public.investments (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  type text,
  amount numeric not null default 0,
  yield_pct numeric default 0,
  created_at timestamptz not null default now()
);

create index if not exists cards_user_id_idx on public.cards (user_id);
create index if not exists transactions_user_id_idx on public.transactions (user_id);
create index if not exists transactions_card_id_idx on public.transactions (card_id);
create index if not exists invoices_user_id_idx on public.invoices (user_id);
create index if not exists invoices_card_id_idx on public.invoices (card_id);
create index if not exists budgets_user_id_idx on public.budgets (user_id);
create index if not exists goals_user_id_idx on public.goals (user_id);
create index if not exists investments_user_id_idx on public.investments (user_id);

-- ---------------------------------------------------------------------
-- Row Level Security
--
-- Cada usuário só enxerga e mexe nas próprias linhas (auth.uid() =
-- user_id), tanto pra ler quanto pra inserir/atualizar/excluir.
-- ---------------------------------------------------------------------

alter table public.cards enable row level security;
alter table public.transactions enable row level security;
alter table public.invoices enable row level security;
alter table public.budgets enable row level security;
alter table public.goals enable row level security;
alter table public.investments enable row level security;

create policy "own rows" on public.cards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.invoices for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.budgets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.investments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
