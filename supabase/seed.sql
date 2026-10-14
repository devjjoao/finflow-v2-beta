-- FinFlow — dados de exemplo (opcional)
-- Rode depois do schema.sql se quiser começar com os mesmos dados de
-- demonstração que o app usava no localStorage. Pode editar/apagar como
-- quiser depois.
--
-- ⚠️ Como esse script roda direto no SQL Editor (fora de uma sessão
-- logada), auth.uid() não funciona aqui — troque 'SEU-USER-ID-AQUI'
-- pelo UUID do usuário dono desses dados (crie uma conta pelo app em
-- /login e copie o UUID em Authentication > Users no painel Supabase).

do $$
declare
  owner uuid := 'SEU-USER-ID-AQUI'; -- <- troque aqui
begin

insert into public.cards (id, user_id, name, brand, "limit", closing_day, due_day, color) values
  ('card-nubank', owner, 'Nubank Ultravioleta', 'Mastercard', 4500, 24, 3, '#8a2be2'),
  ('card-inter', owner, 'Inter Gold', 'Visa', 2200, 10, 17, '#f97316')
on conflict (id) do nothing;

insert into public.transactions (id, user_id, type, description, category, amount, date, card_id) values
  ('tx-1', owner, 'entrada', 'Salário', 'Renda', 3200, current_date - 5, null),
  ('tx-2', owner, 'entrada', 'Freelance site', 'Renda extra', 850, current_date - 3, null),
  ('tx-3', owner, 'saida', 'Supermercado', 'Alimentação', 412.30, current_date - 2, 'card-nubank'),
  ('tx-4', owner, 'saida', 'Netflix', 'Assinaturas', 44.90, current_date - 6, 'card-nubank'),
  ('tx-5', owner, 'saida', 'Combustível', 'Transporte', 180, current_date - 1, 'card-inter'),
  ('tx-6', owner, 'saida', 'Aluguel', 'Moradia', 950, current_date - 8, null),
  ('tx-7', owner, 'saida', 'iFood', 'Alimentação', 63.50, current_date - 1, 'card-nubank'),
  ('tx-8', owner, 'saida', 'Academia', 'Saúde', 99.90, current_date - 10, null)
on conflict (id) do nothing;

insert into public.invoices (id, user_id, card_id, month, status) values
  ('inv-1', owner, 'card-nubank', to_char(current_date, 'YYYY-MM'), 'aberta'),
  ('inv-2', owner, 'card-inter', to_char(current_date, 'YYYY-MM'), 'aberta')
on conflict (id) do nothing;

insert into public.budgets (id, user_id, category, "limit") values
  ('bud-1', owner, 'Alimentação', 700),
  ('bud-2', owner, 'Transporte', 300),
  ('bud-3', owner, 'Assinaturas', 100),
  ('bud-4', owner, 'Moradia', 1000),
  ('bud-5', owner, 'Saúde', 150)
on conflict (id) do nothing;

insert into public.goals (id, user_id, name, target, current, deadline) values
  ('goal-1', owner, 'Reserva de emergência', 10000, 4200, '2026-12-31'),
  ('goal-2', owner, 'Moto nova', 15000, 3100, '2027-06-30'),
  ('goal-3', owner, 'Viagem', 3500, 900, '2026-11-01')
on conflict (id) do nothing;

insert into public.investments (id, user_id, name, type, amount, yield_pct) values
  ('inv-asset-1', owner, 'Tesouro Selic', 'Renda Fixa', 3200, 10.9),
  ('inv-asset-2', owner, 'CDB 110% CDI', 'Renda Fixa', 1800, 11.4),
  ('inv-asset-3', owner, 'IVVB11', 'Renda Variável', 950, 18.2),
  ('inv-asset-4', owner, 'Bitcoin', 'Cripto', 400, 34.5)
on conflict (id) do nothing;

end $$;
