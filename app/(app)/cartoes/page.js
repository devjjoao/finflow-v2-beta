"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, CreditCard } from "lucide-react";
import { db } from "@/lib/storage";
import { sumBy } from "@/lib/finance";
import { EmptyState, formatBRL } from "@/components/UI";
import Modal from "@/components/Modal";

function emptyForm() {
  return { name: "", brand: "Visa", limit: "", closingDay: 1, dueDay: 10, color: "#3b82f6" };
}

const BRANDS = ["Visa", "Mastercard", "Elo", "American Express", "Hipercard"];
const COLORS = ["#3b82f6", "#8a2be2", "#f97316", "#22c55e", "#f43f5e", "#0ea5e9"];

export default function CartoesPage() {
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());

  async function reload() {
    const [c, t] = await Promise.all([db.list("cards"), db.list("transactions")]);
    setCards(c);
    setTransactions(t);
  }

  useEffect(() => {
    (async () => {
      await db.init();
      await reload();
    })();
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (!form.name || !form.limit) return;
    await db.add("cards", { ...form, limit: Number(form.limit), closingDay: Number(form.closingDay), dueDay: Number(form.dueDay) });
    await reload();
    setForm(emptyForm());
    setOpen(false);
  }

  async function remove(id) {
    await db.remove("cards", id);
    await reload();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setOpen(true)}>
          <Plus size={16} /> Novo cartão
        </button>
      </div>

      {cards.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Nenhum cartão cadastrado"
          description="Adicione seus cartões para acompanhar faturas e limites usados."
          action={
            <button className="btn-primary" onClick={() => setOpen(true)}>
              <Plus size={16} /> Novo cartão
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {cards.map((c) => {
            const used = sumBy(transactions, (t) => t.cardId === c.id && t.type === "saida");
            const pct = Math.min(100, Math.round((used / c.limit) * 100)) || 0;
            return (
              <div key={c.id} className="rounded-xl2 overflow-hidden shadow-glow relative group">
                <div
                  className="p-5 text-white flex flex-col justify-between h-40"
                  style={{ background: `linear-gradient(135deg, ${c.color}, ${c.color}99)` }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs opacity-80">{c.brand}</p>
                      <p className="font-display font-semibold text-lg mt-0.5">{c.name}</p>
                    </div>
                    <button
                      onClick={() => remove(c.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/15 hover:bg-white/25 rounded-lg p-1.5"
                      aria-label="Excluir cartão"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1 opacity-90">
                      <span>{formatBRL(used)} usado</span>
                      <span>{formatBRL(c.limit)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/25 overflow-hidden">
                      <div className="h-full bg-white rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
                <div className="card !rounded-none border-t-0 px-5 py-3 flex justify-between text-xs text-slate-500 dark:text-ink-muted">
                  <span>Fecha dia {c.closingDay}</span>
                  <span>Vence dia {c.dueDay}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Novo cartão">
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            className="input"
            placeholder="Nome do cartão"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <select className="input" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}>
              {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <input
              className="input"
              type="number"
              placeholder="Limite"
              value={form.limit}
              onChange={(e) => setForm((f) => ({ ...f, limit: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-slate-400 dark:text-ink-faint flex flex-col gap-1">
              Dia de fechamento
              <input
                className="input"
                type="number"
                min={1}
                max={31}
                value={form.closingDay}
                onChange={(e) => setForm((f) => ({ ...f, closingDay: e.target.value }))}
              />
            </label>
            <label className="text-xs text-slate-400 dark:text-ink-faint flex flex-col gap-1">
              Dia de vencimento
              <input
                className="input"
                type="number"
                min={1}
                max={31}
                value={form.dueDay}
                onChange={(e) => setForm((f) => ({ ...f, dueDay: e.target.value }))}
              />
            </label>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-ink-faint mb-2">Cor</p>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={`w-7 h-7 rounded-full border-2 ${form.color === c ? "border-slate-800 dark:border-white" : "border-transparent"}`}
                  style={{ background: c }}
                  aria-label={`Cor ${c}`}
                />
              ))}
            </div>
          </div>
          <button type="submit" className="btn-primary mt-1">Salvar cartão</button>
        </form>
      </Modal>
    </div>
  );
}
