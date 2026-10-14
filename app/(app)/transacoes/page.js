"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Search, PieChart as PieIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { db } from "@/lib/storage";
import { sumBy, groupByCategory } from "@/lib/finance";
import {
  filterTransactionsByMonth,
  getLocalCurrentMonthKey,
  formatMonthLabel,
} from "@/lib/monthSummary";
import { EmptyState, formatBRL, formatDate } from "@/components/UI";
import Modal from "@/components/Modal";
import MonthSelector from "@/components/MonthSelector";

const CATEGORIES = [
  "Renda", "Renda extra", "Alimentação", "Transporte", "Moradia",
  "Assinaturas", "Saúde", "Lazer", "Educação", "Outros",
];

const CATEGORY_COLORS = ["#3b82f6", "#22c55e", "#f97316", "#f43f5e", "#8a2be2", "#0ea5e9", "#f59e0b", "#14b8a6"];

function emptyForm() {
  return {
    type: "saida",
    description: "",
    category: "Alimentação",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    cardId: "",
  };
}

export default function TransacoesPage() {
  const [items, setItems] = useState([]);
  const [cards, setCards] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [filterType, setFilterType] = useState("todas");
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(getLocalCurrentMonthKey());

  async function reload() {
    const [t, c] = await Promise.all([db.list("transactions"), db.list("cards")]);
    setItems(t);
    setCards(c);
  }

  useEffect(() => {
    (async () => {
      await db.init();
      await reload();
    })();
  }, []);

  // Lista de transações da tabela: filtrada por busca e tipo (mantém histórico global intacto)
  const filtered = useMemo(() => {
    return items
      .filter((t) => (filterType === "todas" ? true : t.type === filterType))
      .filter((t) => t.description.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [items, filterType, search]);

  // Transações do mês selecionado exclusivamente para o gráfico de pizza
  const monthTransactions = useMemo(() => {
    return filterTransactionsByMonth(items, selectedMonth);
  }, [items, selectedMonth]);

  const pieData = useMemo(() => {
    if (filterType === "todas") {
      const entradas = sumBy(monthTransactions, (t) => t.type === "entrada");
      const saidas = sumBy(monthTransactions, (t) => t.type === "saida");
      return [
        { name: "Entradas", value: entradas, color: "#22c55e" },
        { name: "Saídas", value: saidas, color: "#f43f5e" },
      ].filter((d) => d.value > 0);
    }
    return groupByCategory(monthTransactions, filterType).map((g, i) => ({
      name: g.category,
      value: g.total,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));
  }, [monthTransactions, filterType]);

  const pieMonthTotal = useMemo(() => {
    return pieData.reduce((acc, d) => acc + d.value, 0);
  }, [pieData]);

  const pieTitle =
    filterType === "todas"
      ? "Entradas vs. Saídas"
      : filterType === "entrada"
      ? "Receitas por categoria"
      : "Despesas por categoria";

  async function submit(e) {
    e.preventDefault();
    if (!form.description || !form.amount) return;
    await db.add("transactions", {
      ...form,
      amount: Number(form.amount),
      cardId: form.cardId || null,
    });
    await reload();
    setForm(emptyForm());
    setOpen(false);
  }

  async function remove(id) {
    await db.remove("transactions", id);
    await reload();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {["todas", "entrada", "saida"].map((v) => (
            <button
              key={v}
              onClick={() => setFilterType(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filterType === v
                  ? "bg-brand text-white border-brand"
                  : "border-light-border dark:border-base-border text-slate-500 dark:text-ink-muted hover:border-brand/50"
              }`}
            >
              {v === "todas" ? "Todas" : v === "entrada" ? "Entradas" : "Saídas"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-ink-faint" />
            <input
              className="input !pl-9 !w-56"
              placeholder="Buscar transação..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> Nova
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Card do gráfico de pizza com seletor de mês exclusivo */}
        <div className="card p-5 xl:col-span-1 h-fit self-start xl:sticky xl:top-20 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 w-full">
            <div>
              <h3 className="font-display font-semibold text-sm text-slate-800 dark:text-ink">
                {pieTitle}
              </h3>
              {pieMonthTotal > 0 && (
                <p className="text-xs text-slate-400 dark:text-ink-faint">
                  Total no mês:{" "}
                  <strong className="text-slate-800 dark:text-ink font-semibold">
                    {formatBRL(pieMonthTotal)}
                  </strong>
                </p>
              )}
            </div>
            <MonthSelector
              value={selectedMonth}
              onChange={setSelectedMonth}
            />
          </div>

          {pieData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <span className="p-2.5 rounded-full bg-light-soft dark:bg-base-soft text-slate-400 dark:text-ink-faint mb-2">
                <PieIcon size={20} />
              </span>
              <p className="text-xs font-semibold text-slate-700 dark:text-ink">
                Sem dados em {formatMonthLabel(selectedMonth)}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-ink-faint mt-0.5 max-w-[200px]">
                Nenhum lançamento encontrado para este filtro no período.
              </p>
            </div>
          ) : (
            <div className="h-56 w-full my-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {pieData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
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
                  {filterType === "todas" ? <Legend wrapperStyle={{ fontSize: 11 }} /> : null}
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Tabela de transações à direita (mantida com comportamento atual) */}
        <div className="card p-5 xl:col-span-2">
          {filtered.length === 0 ? (
            <EmptyState
              icon={ArrowUpRight}
              title="Nenhuma transação encontrada"
              description="Cadastre entradas e saídas para acompanhar seu fluxo de caixa."
              action={
                <button className="btn-primary" onClick={() => setOpen(true)}>
                  <Plus size={16} /> Nova transação
                </button>
              }
            />
          ) : (
            <div className="flex flex-col divide-y divide-light-border dark:divide-base-border">
              {filtered.map((t) => {
                const card = cards.find((c) => c.id === t.cardId);
                return (
                  <div key={t.id} className="flex items-center justify-between py-3 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${
                          t.type === "entrada" ? "bg-positive/15 text-positive" : "bg-negative/15 text-negative"
                        }`}
                      >
                        {t.type === "entrada" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{t.description}</p>
                        <p className="text-xs text-slate-400 dark:text-ink-faint truncate">
                          {t.category} · {formatDate(t.date)}
                          {card ? ` · ${card.name}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-sm font-semibold ${t.type === "entrada" ? "text-positive" : "text-negative"}`}>
                        {t.type === "entrada" ? "+" : "-"} {formatBRL(t.amount)}
                      </span>
                      <button
                        onClick={() => remove(t.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-negative transition-opacity focus-ring rounded"
                        aria-label="Excluir"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nova transação">
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex gap-2">
            {["saida", "entrada"].map((v) => (
              <button
                type="button"
                key={v}
                onClick={() => setForm((f) => ({ ...f, type: v }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  form.type === v
                    ? v === "entrada"
                      ? "bg-positive/15 border-positive text-positive"
                      : "bg-negative/15 border-negative text-negative"
                    : "border-light-border dark:border-base-border text-slate-500 dark:text-ink-muted"
                }`}
              >
                {v === "entrada" ? "Entrada" : "Saída"}
              </button>
            ))}
          </div>

          <input
            className="input"
            placeholder="Descrição"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            required
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400 dark:text-ink-faint">Categoria</label>
              <select
                className="input mt-1"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 dark:text-ink-faint">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="input mt-1"
                placeholder="0,00"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400 dark:text-ink-faint">Data</label>
              <input
                type="date"
                className="input mt-1"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 dark:text-ink-faint">Cartão (opcional)</label>
              <select
                className="input mt-1"
                value={form.cardId}
                onChange={(e) => setForm((f) => ({ ...f, cardId: e.target.value }))}
              >
                <option value="">Nenhum (à vista/dinheiro)</option>
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
