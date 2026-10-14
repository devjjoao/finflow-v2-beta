"use client";

import { useMemo } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  Sparkles,
  CreditCard,
  Target,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  getLocalCurrentMonthKey,
  getPreviousMonthKey,
  formatMonthLabel,
  calculateMonthTotals,
  calculateMonthComparison,
  calculateTopCategories,
  calculatePendingBills,
  calculateDailyBudget,
  generateDeterministicInsights,
} from "@/lib/monthSummary";
import { formatBRL } from "@/components/UI";

const CATEGORY_COLORS = [
  "#3b82f6",
  "#f97316",
  "#22c55e",
  "#f43f5e",
  "#8a2be2",
  "#0ea5e9",
  "#f59e0b",
];

export default function MonthSummary({
  transactions = [],
  cards = [],
  goals = [],
  paidState = {},
  monthKey = getLocalCurrentMonthKey(),
  saldoTotal = 0,
}) {
  const previousMonthKey = useMemo(() => getPreviousMonthKey(monthKey), [monthKey]);

  // Totais completos do mês (usados nos cards de receitas, despesas e economizado)
  const currentTotals = useMemo(
    () => calculateMonthTotals(transactions, monthKey),
    [transactions, monthKey]
  );

  // Comparação justa: no mês atual, compara com o mesmo período (até o mesmo dia)
  // do mês anterior. Em meses encerrados, compara o mês inteiro.
  const untilDay = useMemo(
    () => (monthKey === getLocalCurrentMonthKey() ? new Date().getDate() : null),
    [monthKey]
  );

  const currentPartial = useMemo(
    () => calculateMonthTotals(transactions, monthKey, untilDay),
    [transactions, monthKey, untilDay]
  );

  const previousPartial = useMemo(
    () => calculateMonthTotals(transactions, previousMonthKey, untilDay),
    [transactions, previousMonthKey, untilDay]
  );

  const comparison = useMemo(
    () => calculateMonthComparison(currentPartial, previousPartial),
    [currentPartial, previousPartial]
  );

  const topCategories = useMemo(
    () => calculateTopCategories(transactions, monthKey, 4),
    [transactions, monthKey]
  );

  const pendingBills = useMemo(
    () =>
      calculatePendingBills({
        transactions,
        cards,
        paidState,
        monthKey,
      }),
    [transactions, cards, paidState, monthKey]
  );

  // Gasto diário calculado a partir do SALDO TOTAL (e não do saldo do mês)
  const dailyBudget = useMemo(
    () =>
      calculateDailyBudget({
        saldoDisponivel: saldoTotal,
        contasPrevistas: pendingBills.totalPending,
      }),
    [saldoTotal, pendingBills.totalPending]
  );

  const insights = useMemo(
    () =>
      generateDeterministicInsights({
        currentTotals,
        previousTotals: previousPartial,
        comparison,
        topCategories,
        pendingBills,
        dailyBudget,
      }),
    [currentTotals, previousPartial, comparison, topCategories, pendingBills, dailyBudget]
  );

  const isPositiveBalance = currentTotals.saldo >= 0;

  return (
    <section className="flex flex-col gap-5">
      {/* Cabeçalho da seção */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-light-border dark:border-base-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand" />
            <h2 className="font-display font-bold text-xl text-slate-800 dark:text-ink">
              Meu mês
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand">
              {formatMonthLabel(monthKey)}
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-ink-faint mt-0.5">
            Visão consolidada do fluxo atual e ritmo diário planejado.
          </p>
        </div>
      </div>

      {/* CARD PRINCIPAL (HERO): Saldo Total em destaque com métricas do mês selecionado */}
      <div className="card p-6 md:p-8 bg-gradient-to-br from-light-card via-light-card to-light-soft dark:from-base-card dark:via-base-card dark:to-base-soft relative overflow-hidden">
        {/* Brilho decorativo sutil */}
        <div
          className={`pointer-events-none absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[90px] opacity-15 ${
            isPositiveBalance ? "bg-positive" : "bg-negative"
          }`}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Lado Esquerdo: Saldo Total em destaque principal */}
          <div className="lg:col-span-6 flex flex-col gap-1.5">
            <span className="label-eyebrow !px-0">Saldo Total</span>

            <div className="flex items-baseline gap-3">
              <span className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-800 dark:text-ink">
                {formatBRL(saldoTotal)}
              </span>
            </div>

            {/* Linha secundária: Saldo do mês + Selo Superávit/Déficit */}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs text-slate-500 dark:text-ink-muted">
                Saldo do mês:{" "}
                <strong
                  className={`font-semibold ${
                    currentTotals.saldo > 0
                      ? "text-positive"
                      : currentTotals.saldo < 0
                      ? "text-negative"
                      : "text-slate-700 dark:text-ink"
                  }`}
                >
                  {formatBRL(currentTotals.saldo)}
                </strong>
              </span>

              {/* Selo ligado ao saldo do MÊS, apenas quando diferente de zero */}
              {currentTotals.saldo !== 0 ? (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                    currentTotals.saldo > 0
                      ? "bg-positive/10 text-positive"
                      : "bg-negative/10 text-negative"
                  }`}
                >
                  {currentTotals.saldo > 0 ? "Superávit" : "Déficit"}
                </span>
              ) : null}
            </div>

            {/* Comparação com o mesmo período do mês anterior */}
            {comparison.hasCurrentData && comparison.hasPreviousData && comparison.diffSaldo !== 0 ? (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-ink-muted mt-0.5">
                {comparison.diffSaldo > 0 ? (
                  <span className="inline-flex items-center gap-0.5 font-semibold text-positive">
                    <TrendingUp size={13} />
                    +{formatBRL(comparison.diffSaldo)}
                    {comparison.pctSaldo !== null
                      ? ` (+${Math.round(comparison.pctSaldo)}%)`
                      : ""}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 font-semibold text-negative">
                    <TrendingDown size={13} />
                    {formatBRL(comparison.diffSaldo)}
                    {comparison.pctSaldo !== null
                      ? ` (${Math.round(comparison.pctSaldo)}%)`
                      : ""}
                  </span>
                )}
                <span>vs. mês anterior</span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 dark:text-ink-faint mt-0.5">
                {!comparison.hasCurrentData
                  ? "Sem movimentações registradas no mês atual."
                  : "Primeiro período registrado para comparativos."}
              </p>
            )}
          </div>

          {/* Lado Direito: Métricas complementares */}
          <div className="lg:col-span-6 grid grid-cols-3 gap-3 border-t lg:border-t-0 lg:border-l border-light-border dark:border-base-border pt-4 lg:pt-0 lg:pl-6">
            {/* Receitas */}
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-slate-400 dark:text-ink-faint flex items-center gap-1">
                <ArrowUpRight size={12} className="text-positive" /> Receitas
              </span>
              <p className="font-display text-base sm:text-lg font-bold text-positive mt-1">
                {formatBRL(currentTotals.receitas)}
              </p>
            </div>

            {/* Despesas */}
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-slate-400 dark:text-ink-faint flex items-center gap-1">
                <ArrowDownRight size={12} className="text-negative" /> Despesas
              </span>
              <p className="font-display text-base sm:text-lg font-bold text-negative mt-1">
                {formatBRL(currentTotals.despesas)}
              </p>
            </div>

            {/* Economizado */}
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-slate-400 dark:text-ink-faint flex items-center gap-1">
                <Wallet size={12} className="text-brand" /> Economizado
              </span>
              <p className="font-display text-base sm:text-lg font-bold text-slate-800 dark:text-ink mt-1">
                {formatBRL(currentTotals.economizado)}
              </p>
              {currentTotals.receitas > 0 ? (
                <span className="text-[10px] text-slate-400 dark:text-ink-faint">
                  {Math.round(currentTotals.taxaPoupanca)}% da receita
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO DE 3 COLUNAS: Ritmo Diário, Top Categorias e Contas/Metas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Card 1: Quanto posso gastar por dia */}
        <div className="card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="label-eyebrow !px-0">Ritmo Diário</span>
              <span className="p-1.5 rounded-lg bg-brand/10 text-brand">
                <Calendar size={16} />
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-ink-muted mb-2">
              Quanto você pode gastar por dia até o fim do mês:
            </p>
            <div className="flex items-baseline gap-2">
              <p className="font-display text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-ink">
                {formatBRL(dailyBudget.dailyAmount)}
              </p>
              <span className="text-xs text-slate-400 dark:text-ink-faint">/ dia</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-light-border dark:border-base-border text-xs flex flex-col gap-1.5">
            <div className="flex justify-between text-slate-500 dark:text-ink-muted">
              <span>Dias restantes no mês:</span>
              <span className="font-semibold text-slate-800 dark:text-ink">
                {dailyBudget.daysRemaining} {dailyBudget.daysRemaining === 1 ? "dia" : "dias"}
              </span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-ink-muted">
              <span>Saldo livre previsto:</span>
              <span
                className={`font-semibold ${
                  dailyBudget.saldoLiquido >= 0 ? "text-slate-800 dark:text-ink" : "text-negative"
                }`}
              >
                {formatBRL(dailyBudget.saldoLiquido)}
              </span>
            </div>
            {dailyBudget.isDeficit && (
              <p className="text-[11px] text-negative font-medium flex items-center gap-1 mt-1">
                <AlertTriangle size={13} /> Contas superam o saldo disponível.
              </p>
            )}
          </div>
        </div>

        {/* Card 2: Principais Categorias de Gasto */}
        <div className="card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="label-eyebrow !px-0">Top Categorias</span>
              <span className="text-xs text-slate-400 dark:text-ink-faint">
                {topCategories.length} {topCategories.length === 1 ? "categoria" : "categorias"}
              </span>
            </div>

            {topCategories.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-ink-faint py-6 text-center">
                Nenhuma despesa registrada este mês.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {topCategories.map((cat, index) => (
                  <div key={cat.category} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-ink truncate max-w-[140px]">
                        {cat.category}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-slate-400 dark:text-ink-faint text-[11px]">
                          {Math.round(cat.percentage)}%
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-ink">
                          {formatBRL(cat.total)}
                        </span>
                      </div>
                    </div>
                    {/* Barra de progresso de proporção */}
                    <div className="h-1.5 w-full rounded-full bg-light-border dark:bg-base-border overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(5, cat.percentage))}%`,
                          backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-light-border dark:border-base-border text-xs flex justify-between text-slate-500 dark:text-ink-muted">
            <span>Total despesas do mês:</span>
            <span className="font-semibold text-slate-800 dark:text-ink">
              {formatBRL(currentTotals.despesas)}
            </span>
          </div>
        </div>

        {/* Card 3: Próximas Contas a Vencer & Metas */}
        <div className="card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="label-eyebrow !px-0">Próximas Contas</span>
              <span className="p-1.5 rounded-lg bg-warn/10 text-warn">
                <CreditCard size={16} />
              </span>
            </div>

            {pendingBills.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <CheckCircle2 size={20} className="text-positive mb-1" />
                <p className="text-xs text-slate-500 dark:text-ink-muted">
                  Nenhuma conta prevista pendente para este mês.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-36 overflow-y-auto pr-1">
                {pendingBills.items.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-light-soft dark:bg-base-soft border border-light-border dark:border-base-border"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-medium text-slate-800 dark:text-ink truncate">
                        {item.title}
                      </p>
                      {item.dueDay ? (
                        <p className="text-[10px] text-slate-400 dark:text-ink-faint">
                          Vencimento dia {item.dueDay}
                        </p>
                      ) : null}
                    </div>
                    <span className="font-semibold text-negative shrink-0">
                      {formatBRL(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Progresso de Metas (SOMENTE se houver metas cadastradas) */}
            {goals && goals.length > 0 ? (
              <div className="mt-4 pt-3 border-t border-light-border dark:border-base-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-ink flex items-center gap-1">
                    <Target size={13} className="text-brand" /> Progresso das Metas
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-ink-faint">
                    {goals.length} {goals.length === 1 ? "meta" : "metas"}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {goals.slice(0, 2).map((g) => {
                    const pct = Math.min(100, Math.round((g.current / g.target) * 100)) || 0;
                    return (
                      <div key={g.id}>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="font-medium text-slate-700 dark:text-ink truncate max-w-[130px]">
                            {g.name}
                          </span>
                          <span className="text-slate-400 dark:text-ink-faint font-semibold">
                            {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-light-border dark:bg-base-border overflow-hidden">
                          <div className="h-full bg-brand rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-4 pt-3 border-t border-light-border dark:border-base-border text-xs flex justify-between text-slate-500 dark:text-ink-muted">
            <span>Previsão de saídas:</span>
            <span className="font-semibold text-negative">
              {formatBRL(pendingBills.totalPending)}
            </span>
          </div>
        </div>
      </div>

      {/* BLOCO DE INSIGHTS AUTOMÁTICOS (Determinísticos, 3 a 5 frases curtas) */}
      <div className="card p-5 bg-light-soft/50 dark:bg-base-card/60">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-brand" />
          <h3 className="font-display font-semibold text-sm text-slate-800 dark:text-ink">
            Insights Automáticos do Período
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 p-2.5 rounded-xl bg-light-card dark:bg-base-soft border border-light-border dark:border-base-border text-xs text-slate-600 dark:text-ink-muted"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0 mt-1.5" />
              <span className="leading-relaxed">{insight}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}