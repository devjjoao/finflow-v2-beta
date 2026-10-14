"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { db } from "@/lib/storage";
import { sumBy, monthlySeries } from "@/lib/finance";
import { EmptyState, formatBRL, formatDate } from "@/components/UI";
import MonthSummary from "@/components/MonthSummary";

export default function DashboardPage() {
  const [transactions, setTransactions] = useState([]);
  const [cards, setCards] = useState([]);
  const [goals, setGoals] = useState([]);
  const [paidState, setPaidState] = useState({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await db.init();
      const [t, c, g] = await Promise.all([
        db.list("transactions"),
        db.list("cards"),
        db.list("goals"),
      ]);
      setTransactions(t);
      setCards(c);
      setGoals(g);
      try {
        const saved = JSON.parse(window.localStorage.getItem("finflow_invoice_paid") || "{}");
        setPaidState(saved);
      } catch (e) {
        setPaidState({});
      }
      setReady(true);
    })();
  }, []);

  const saldoGlobal = useMemo(
    () =>
      sumBy(transactions, (t) => t.type === "entrada") -
      sumBy(transactions, (t) => t.type === "saida"),
    [transactions]
  );

  const limiteTotal = cards.reduce((a, c) => a + Number(c.limit || 0), 0);
  const usadoCartoes = useMemo(
    () => sumBy(transactions, (t) => t.type === "saida" && !!t.cardId),
    [transactions]
  );

  const series = useMemo(() => monthlySeries(transactions), [transactions]);
  const recent = [...transactions]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6);

  if (!ready) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand/30 border-t-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Seção Meu mês em destaque */}
      <MonthSummary
        transactions={transactions}
        cards={cards}
        goals={goals}
        paidState={paidState}
        saldoTotal={saldoGlobal}
      />

      {/* Histórico e fluxo complementar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <h3 className="font-display font-semibold text-base text-slate-800 dark:text-ink">
            Histórico e Visão Geral
          </h3>
          {limiteTotal > 0 && (
            <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-ink-faint">
              <span>
                Uso de cartões:{" "}
                <strong className="text-slate-800 dark:text-ink font-semibold">
                  {formatBRL(usadoCartoes)}
                </strong>
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="card p-5 xl:col-span-2">
            <h4 className="font-display font-semibold mb-4 text-sm text-slate-800 dark:text-ink">
              Entradas vs. Saídas — últimos 6 meses
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="gEntradas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gSaidas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#8b93a730" vertical={false} />
                  <XAxis dataKey="name" stroke="#8b93a7" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8b93a7" fontSize={12} tickLine={false} axisLine={false} width={40} />
                  <Tooltip
                    contentStyle={{
                      background: "#131a2b",
                      border: "1px solid #1e2740",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "#e7ecf7",
                    }}
                    itemStyle={{ color: "#e7ecf7" }}
                    labelStyle={{ color: "#8b93a7" }}
                    formatter={(v) => formatBRL(v)}
                  />
                  <Area type="monotone" dataKey="Entradas" stroke="#22c55e" fill="url(#gEntradas)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Saídas" stroke="#f43f5e" fill="url(#gSaidas)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-5">
            <h4 className="font-display font-semibold mb-4 text-sm text-slate-800 dark:text-ink">
              Transações Recentes
            </h4>
            {recent.length === 0 ? (
              <EmptyState title="Sem transações" description="Cadastre entradas ou saídas para vê-las aqui." />
            ) : (
              <div className="flex flex-col divide-y divide-light-border dark:divide-base-border">
                {recent.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
                          t.type === "entrada" ? "bg-positive/15 text-positive" : "bg-negative/15 text-negative"
                        }`}
                      >
                        {t.type === "entrada" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{t.description}</p>
                        <p className="text-[10px] text-slate-400 dark:text-ink-faint">
                          {t.category} · {formatDate(t.date)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold shrink-0 ml-2 ${
                        t.type === "entrada" ? "text-positive" : "text-negative"
                      }`}
                    >
                      {t.type === "entrada" ? "+" : "-"} {formatBRL(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
