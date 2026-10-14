"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { db } from "@/lib/storage";
import { EmptyState, formatBRL } from "@/components/UI";
import Modal from "@/components/Modal";

const TYPES = ["Renda Fixa", "Renda Variável", "Fundos Imobiliários", "Cripto", "Reserva"];
const COLORS = ["#3b82f6", "#22c55e", "#f97316", "#8a2be2", "#0ea5e9"];

function emptyForm() {
  return { name: "", type: "Renda Fixa", amount: "", yieldPct: "" };
}

export default function InvestimentosPage() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());

  async function reload() {
    setItems(await db.list("investments"));
  }

  useEffect(() => {
    (async () => {
      await db.init();
      await reload();
    })();
  }, []);

  const total = items.reduce((a, i) => a + Number(i.amount || 0), 0);

  const byType = useMemo(() => {
    const map = {};
    items.forEach((i) => {
      map[i.type] = (map[i.type] || 0) + Number(i.amount || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [items]);

  async function submit(e) {
    e.preventDefault();
    if (!form.name || !form.amount) return;
    await db.add("investments", { ...form, amount: Number(form.amount), yieldPct: Number(form.yieldPct || 0) });
    await reload();
    setForm(emptyForm());
    setOpen(false);
  }

  async function remove(id) {
    await db.remove("investments", id);
    await reload();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="card px-5 py-4">
          <p className="text-xs text-slate-400 dark:text-ink-faint">Patrimônio investido</p>
          <p className="font-display text-2xl font-bold">{formatBRL(total)}</p>
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)}>
          <Plus size={16} /> Novo investimento
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Nenhum investimento cadastrado"
          description="Registre seus ativos para acompanhar a alocação do seu patrimônio."
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="card p-5">
            <h3 className="font-display font-semibold mb-2">Alocação</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byType} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {byType.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#131a2b", border: "1px solid #1e2740", borderRadius: 8, fontSize: 12, color: "#e7ecf7" }}
                    itemStyle={{ color: "#e7ecf7" }}
                    labelStyle={{ color: "#8b93a7" }}
                    formatter={(v) => formatBRL(v)}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-5 xl:col-span-2">
            <h3 className="font-display font-semibold mb-4">Ativos</h3>
            <div className="flex flex-col divide-y divide-light-border dark:divide-base-border">
              {items.map((i) => (
                <div key={i.id} className="flex items-center justify-between py-3 group">
                  <div>
                    <p className="text-sm font-medium">{i.name}</p>
                    <p className="text-xs text-slate-400 dark:text-ink-faint">{i.type} · rendimento {i.yieldPct}% a.a.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{formatBRL(i.amount)}</span>
                    <button
                      onClick={() => remove(i.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-negative transition-opacity"
                      aria-label="Excluir"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Novo investimento">
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            className="input"
            placeholder="Nome do ativo"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <select className="input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input
              className="input"
              type="number"
              placeholder="Valor aplicado"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              required
            />
            <input
              className="input"
              type="number"
              step="0.1"
              placeholder="Rendimento % a.a."
              value={form.yieldPct}
              onChange={(e) => setForm((f) => ({ ...f, yieldPct: e.target.value }))}
            />
          </div>
          <button type="submit" className="btn-primary mt-1">Salvar investimento</button>
        </form>
      </Modal>
    </div>
  );
}
