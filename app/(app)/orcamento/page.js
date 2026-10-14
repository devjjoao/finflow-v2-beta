"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, PieChart as PieIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { db } from "@/lib/storage";
import { sumBy, monthKey, currentMonthKey } from "@/lib/finance";
import { EmptyState, formatBRL } from "@/components/UI";
import Modal from "@/components/Modal";

const COLORS = ["#3b82f6", "#22c55e", "#f97316", "#f43f5e", "#8a2be2", "#0ea5e9", "#f59e0b", "#14b8a6"];

function emptyForm() {
  return { category: "", limit: "" };
}

export default function OrcamentoPage() {
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());

  async function reload() {
    const [b, t] = await Promise.all([db.list("budgets"), db.list("transactions")]);
    setBudgets(b);
    setTransactions(t);
  }

  useEffect(() => {
    (async () => {
      await db.init();
      await reload();
    })();
  }, []);

  const mKey = currentMonthKey();

  const rows = useMemo(() => {
    return budgets.map((b) => {
      const spent = sumBy(
        transactions,
        (t) => t.type === "saida" && t.category === b.category && monthKey(t.date) === mKey
      );
      return { ...b, spent, pct: Math.min(100, Math.round((spent / b.limit) * 100)) || 0 };
    });
  }, [budgets, transactions]);

  const pieData = rows.filter((r) => r.spent > 0).map((r) => ({ name: r.category, value: r.spent }));

  async function submit(e) {
    e.preventDefault();
    if (!form.category || !form.limit) return;
    await db.add("budgets", { category: form.category, limit: Number(form.limit) });
    await reload();
    setForm(emptyForm());
    setOpen(false);
  }

  async function remove(id) {
    await db.remove("budgets", id);
    await reload();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setOpen(true)}>
          <Plus size={16} /> Nova categoria
        </button>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={PieIcon}
          title="Nenhum orçamento definido"
          description="Crie limites mensais por categoria para controlar seus gastos."
          action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Nova categoria</button>}
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="card p-5 xl:col-span-1 flex flex-col items-center justify-center">
            <h3 className="font-display font-semibold self-start mb-2">Distribuição do mês</h3>
            {pieData.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-ink-faint py-10">Sem gastos registrados este mês.</p>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#131a2b", border: "1px solid #1e2740", borderRadius: 8, fontSize: 12, color: "#e7ecf7" }}
                      itemStyle={{ color: "#e7ecf7" }}
                      labelStyle={{ color: "#8b93a7" }}
                      formatter={(v) => formatBRL(v)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card p-5 xl:col-span-2">
            <h3 className="font-display font-semibold mb-4">Limites por categoria</h3>
            <div className="flex flex-col gap-4">
              {rows.map((r, i) => (
                <div key={r.id} className="group">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      {r.category}
                    </span>
                    <span className="text-slate-400 dark:text-ink-faint flex items-center gap-3">
                      {formatBRL(r.spent)} / {formatBRL(r.limit)}
                      <button
                        onClick={() => remove(r.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-negative transition-opacity"
                        aria-label="Excluir"
                      >
                        <Trash2 size={13} />
                      </button>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-light-border dark:bg-base-border overflow-hidden">
                    <div
                      className={`h-full rounded-full ${r.pct >= 100 ? "bg-negative" : r.pct >= 80 ? "bg-warn" : "bg-brand"}`}
                      style={{ width: `${r.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nova categoria de orçamento">
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            className="input"
            placeholder="Nome da categoria (ex: Alimentação)"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            required
          />
          <input
            className="input"
            type="number"
            placeholder="Limite mensal"
            value={form.limit}
            onChange={(e) => setForm((f) => ({ ...f, limit: e.target.value }))}
            required
          />
          <button type="submit" className="btn-primary mt-1">Salvar</button>
        </form>
      </Modal>
    </div>
  );
}
