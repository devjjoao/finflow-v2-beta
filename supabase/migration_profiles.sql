-- FinFlow — migração: perfil de usuário + bucket de avatares
--
-- Rode este script no SQL Editor do Supabase:
--   Project > SQL Editor > New query > cole tudo e clique em "Run"
--
-- O que este script faz:
--   1. Cria a tabela public.profiles (id, full_name, avatar_url, updated_at)
--   2. Habilita RLS para que cada usuário só acesse o próprio perfil
--   3. Cria um trigger que gera o perfil automaticamente quando um novo
--      usuário se registra (pega o nome do Google OAuth se disponível)
--   4. Popula perfis para usuários que já existem no banco
--   5. Cria o bucket "avatars" no Storage (público para leitura, com limites de 2MB e tipos válidos)
--   6. Cria as políticas do Storage para upload/update/delete por usuário
-- =====================================================================

-- =====================================================================
-- PARTE 1 — Tabela profiles
-- =====================================================================

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  avatar_url text,
  updated_at timestamptz default now()
);

-- RLS: cada usuário só lê e edita o próprio perfil
alter table public.profiles enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile"
  on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- =====================================================================
-- PARTE 2 — Trigger para criar perfil automaticamente no signup
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      ''
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Remove trigger antigo se existir (evita erro de duplicata)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- PARTE 3 — Popular perfis para usuários que já existem
-- =====================================================================

insert into public.profiles (id, full_name)
select
  id,
  coalesce(
    raw_user_meta_data ->> 'full_name',
    raw_user_meta_data ->> 'name',
    ''
  )
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;

-- =====================================================================
-- PARTE 4 — Bucket "avatars" no Supabase Storage
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- =====================================================================
-- PARTE 5 — Políticas de acesso ao bucket "avatars"
-- =====================================================================

-- Leitura pública (qualquer pessoa pode ver os avatares via URL)
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Upload: usuário autenticado, apenas na própria pasta (pasta = user_id)
drop policy if exists "avatars user upload" on storage.objects;
create policy "avatars user upload"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Substituição: mesma regra do upload
drop policy if exists "avatars user update" on storage.objects;
create policy "avatars user update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Deleção: cada usuário só deleta da própria pasta
drop policy if exists "avatars user delete" on storage.objects;
create policy "avatars user delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
