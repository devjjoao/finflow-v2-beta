-- FinFlow — addendum: habilita Realtime na tabela changelog
--
-- Se você JÁ rodou o migration_changelog.sql antes dessa atualização,
-- não precisa rodar ele de novo (ia dar erro de policy duplicada).
-- Só rode esta linha aqui embaixo no SQL Editor:

alter publication supabase_realtime add table public.changelog;

-- Isso é o que faz a bolinha de "novidade" na aba Novidades aparecer
-- na hora pra quem já está com o app aberto, assim que um admin
-- publica algo novo — sem precisar dar F5.
--
-- Se você ainda NÃO rodou o migration_changelog.sql, ignore este
-- arquivo: essa linha já está incluída lá no final.
