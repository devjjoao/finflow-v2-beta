# FinFlow — Gestão Pessoal

App de finanças pessoais em **Next.js (App Router) + JavaScript puro** (zero TypeScript), com **Tailwind CSS**, tema **claro/escuro** (inicia em escuro) e suporte a **PWA** (instalável, funciona offline).

## Rodando localmente

```bash
npm install
```

### Configurar o Supabase (obrigatório)

Este app usa **Supabase** como backend, com **login** (Supabase Auth), storage para avatares e dados **isolados por usuário** via Row Level Security.

1. Crie um projeto em [supabase.com](https://supabase.com) (grátis).
2. Abra **SQL Editor** no painel do projeto:
   - Cole o conteúdo de `supabase/schema.sql` e rode. Isso cria as tabelas `cards`, `transactions`, `invoices`, `budgets`, `goals` e `investments`, cada uma com uma coluna `user_id` e RLS restringindo cada usuário aos próprios dados.
   - Cole o conteúdo de `supabase/migration_profiles.sql` e rode. Isso cria a tabela `profiles`, o trigger de criação automática de perfil para novos usuários, o bucket de Storage `avatars` (com limite de 2 MB e tipos JPG, PNG, WEBP) e as políticas RLS para upload, substituição e remoção de fotos apenas pelo próprio dono.
3. Em **Authentication > Providers**, o login por **Email** já vem habilitado. Se quiser o botão "Continuar com Google", habilite o provedor **Google** também (precisa de Client ID/Secret do Google Cloud Console).
4. Copie `.env.local.example` para `.env.local` e preencha com a **Project URL** e a **anon public key** (em Project Settings > API):

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

5. Rode o app, crie uma conta pela tela `/login` e comece a usar:

```bash
npm run dev
```

**Dados de exemplo (opcional):** `supabase/seed.sql` popula o banco com os mesmos dados de demonstração que o app tinha antes — mas como cada linha precisa de um dono, primeiro crie sua conta pelo app, pegue seu UUID em **Authentication > Users** no painel Supabase, cole no lugar de `'SEU-USER-ID-AQUI'` no topo do arquivo e só então rode.

**Já rodou uma versão antiga do schema (sem login)?** Use `supabase/migration-add-user-id.sql` em vez de rodar o `schema.sql` de novo — ele adiciona a coluna `user_id` às tabelas existentes sem apagar nada.

Acesse `http://localhost:3000` (redireciona para `/dashboard`).

Para testar como PWA de verdade (service worker só funciona em produção/HTTPS ou localhost):

```bash
npm run build
npm run start
```

Abra no Chrome/Edge e use "Instalar app" na barra de endereço, ou no celular use "Adicionar à tela inicial".

## Estrutura de pastas

```
app/
  layout.js             -> layout raiz: tema, PWA, auth provider
  page.js               -> redireciona para /dashboard
  globals.css           -> tokens de cor e classes utilitárias (.card, .input, .btn-primary...)
  (app)/
    layout.js           -> layout autenticado com Sidebar e Topbar
    dashboard/page.js   -> Dashboard com seção "Meu mês" em destaque
    transacoes/page.js  -> Lançamentos com gráficos de pizza filtrados por mês
    cartoes/page.js
    faturas/page.js
    orcamento/page.js
    metas/page.js
    investimentos/page.js
    novidades/page.js
    perfil/page.js      -> perfil do usuário com foto, edição de nome e email estático
  login/page.js

components/
  Avatar.js             -> avatar com imagem, preview, iniciais e tratamento de erro
  MonthSelector.js      -> seletor de mês (< Mês AAAA >) com bloqueio de meses futuros
  MonthSummary.js       -> componente de resumo do período atual ("Meu mês")
  Sidebar.js            -> menu lateral com navegação e card do usuário
  Topbar.js             -> cabeçalho com título da página, tema e dropdown do perfil
  Modal.js              -> modal genérico usado nos formulários
  UI.js                 -> StatCard, EmptyState, formatBRL, formatDate
  ServiceWorkerRegister.js

lib/
  AuthContext.js        -> contexto de autenticação integrado ao perfil do usuário
  monthSummary.js       -> cálculos puros, recorte mensal e insights determinísticos
  profile.js            -> operações de perfil e upload/remoção no Supabase Storage
  storage.js            -> camada de persistência com o Supabase para entidades financeiras
  ThemeContext.js       -> contexto de tema claro/escuro
  finance.js            -> funções de cálculo financeiro e séries temporais

supabase/
  schema.sql            -> schema principal das tabelas financeiras
  migration_profiles.sql-> migração de perfis, triggers e bucket de avatares com RLS
  seed.sql              -> dados de exemplo

public/
  manifest.json         -> manifesto do PWA
  sw.js                 -> service worker (cache offline simples)
  icons/                -> ícones gerados para o manifesto
```

## Como os dados funcionam (importante)

Os dados ficam no **Supabase** (Postgres gerenciado). Toda leitura/escrita passa pelo objeto `db` em `lib/storage.js`, que é assíncrono e conversa com o Supabase por baixo dos panos:

```js
await db.list("transactions")           // lista tudo
await db.add("transactions", { ... })   // adiciona (gera id automático)
await db.update("goals", id, { current: 500 })
await db.remove("cards", id)
```

O client do Supabase fica em `lib/supabaseClient.js`, lendo `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` do `.env.local`.

As fotos de perfil ficam no **Supabase Storage** no bucket `avatars`, com arquivos organizados na pasta do próprio usuário (`{user_id}/avatar.{ext}`). Ao enviar uma nova foto ou remover a existente, arquivos antigos são excluídos automaticamente para evitar acúmulo de arquivos sem uso.

## Funcionalidades implementadas

- **Seção "Meu mês" (Dashboard)**:
  - Saldo do mês em destaque principal (superávit/déficit), receitas, despesas e valor economizado.
  - Comparativo com o mês anterior (valor e percentual).
  - Quanto o usuário pode gastar por dia até o fim do mês com cálculo determinístico e tratamento de bordas.
  - Principais categorias de despesa do mês com barras de proporção.
  - Próximas contas a vencer (faturas de cartão e despesas futuras) e progresso de metas.
  - 3 a 5 insights automáticos determinísticos gerados por regras baseadas em dados (sem IA/LLM).
- **Gráficos de Pizza com Seletor Mensal (Transações)**:
  - Seletor de mês `< Mês AAAA >` exclusivo para o gráfico de pizza.
  - Mês inicial configurado como o mês atual, com bloqueio para meses futuros e navegação livre para meses passados (com estado vazio informativo).
  - Totais, percentuais e legendas sincronizados exclusivamente com o mês selecionado, sem afetar a listagem geral de transações.
- **Perfil do Usuário**: foto de perfil no Supabase Storage com pré-visualização antes de salvar, opção de substituir e remover, avatar padrão com iniciais do nome/email, edição do nome completo e exibição de e-mail.
- **Dashboard**: saldo total, fluxo do período, uso de cartões, gráfico de entradas vs. saídas (6 meses), metas em progresso, últimas transações.
- **Transações**: lançar entrada/saída, categorizar, vincular a um cartão, filtrar por tipo e buscar, excluir.
- **Meus Cartões**: cadastro de cartões (bandeira, limite, fechamento, vencimento, cor), barra de limite usado.
- **Faturas**: fatura por cartão agrupada por mês de referência, marcar como paga.
- **Orçamento**: limite mensal por categoria, gráfico de pizza da distribuição do mês, barra de progresso por categoria.
- **Metas**: metas com valor alvo, prazo, aporte rápido de valores, progresso visual.
- **Investimentos**: cadastro de ativos por tipo, gráfico de alocação, rendimento % a.a.

## Tema claro/escuro

Implementado via classe `dark` no `<html>` (padrão Tailwind `darkMode: "class"`). Um script inline no `<head>` aplica a classe certa **antes** do React hidratar, então não existe "flash" de tema errado. O padrão é sempre **escuro** na primeira visita; depois disso, a escolha do usuário fica salva em `localStorage`.

## PWA

- `manifest.json` com ícones 192/512 (+ maskable) e `theme_color` escuro.
- `sw.js` faz cache "network-first" das páginas visitadas, com fallback para o cache quando offline.

## Próximos passos sugeridos

- Migrar o "pago/não pago" das faturas do `localStorage` para a tabela `invoices`.
- Opção de redefinir senha a partir da tela de perfil ou configurações de conta.
- Adicionar notificações push reais (hoje o service worker só cuida de cache offline).
- Exportar relatórios (PDF/CSV) da aba Transações.
