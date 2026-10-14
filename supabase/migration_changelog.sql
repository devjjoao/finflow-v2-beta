-- FinFlow — migração: Novidades (changelog) via Supabase + sistema de admin
--
-- Rode este script no SQL Editor do seu projeto Supabase (não precisa
-- re-rodar o schema.sql inteiro, é só isso aqui em cima do banco que
-- você já tem).
--
-- O que isso cria:
--   1. app_admins   -> lista de quem pode postar novidades
--   2. changelog    -> as próprias entradas de novidade
--   3. Policies de RLS: todo mundo autenticado LÊ o changelog, mas só
--      quem está em app_admins consegue INSERIR ou APAGAR entradas.

-- ---------------------------------------------------------------------
-- 1) Quem é admin (pode postar novidade)
-- ---------------------------------------------------------------------
create table if not exists public.app_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;

-- Cada usuário só consegue checar se ELE MESMO é admin (não vê a lista toda).
create policy "self can check admin" on public.app_admins
  for select using (auth.uid() = user_id);

-- Função auxiliar (security definer) usada pelas policies do changelog,
-- pra evitar RLS recursiva ao checar admin dentro de outra tabela.
create or replace function public.is_app_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.app_admins where user_id = uid);
$$;

-- ---------------------------------------------------------------------
-- 2) Changelog / Novidades
-- ---------------------------------------------------------------------
create table if not exists public.changelog (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tag text not null default 'novo' check (tag in ('novo', 'melhoria', 'correcao')),
  title text not null,
  items text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists changelog_created_at_idx on public.changelog (created_at desc);

alter table public.changelog enable row level security;

-- Qualquer pessoa logada pode LER as novidades.
create policy "everyone can read changelog" on public.changelog
  for select using (true);

-- Só admins podem criar ou apagar entradas.
create policy "admins can insert changelog" on public.changelog
  for insert with check (public.is_app_admin(auth.uid()));

create policy "admins can delete changelog" on public.changelog
  for delete using (public.is_app_admin(auth.uid()));

-- Habilita Realtime nessa tabela: é o que faz a bolinha de "novidade"
-- aparecer na hora, pra quem já está com o app aberto, assim que um
-- admin publica algo novo — sem precisar dar F5.
alter publication supabase_realtime add table public.changelog;

-- ---------------------------------------------------------------------
-- 3) Como virar admin (fazer isso pra sua própria conta)
-- ---------------------------------------------------------------------
-- 1. Crie/faça login na sua conta normalmente pela tela do FinFlow.
-- 2. No Supabase, vá em Authentication > Users, copie o UUID dela.
-- 3. Rode aqui no SQL Editor (trocando o UUID):
--
--    insert into public.app_admins (user_id) values ('COLE-SEU-UUID-AQUI');
--
-- Pronto. Da próxima vez que você entrar no app, a aba Novidades vai
-- mostrar o botão "Nova novidade" só pra essa conta — sem precisar
-- mexer em código nenhum pra postar as próximas atualizações.
