"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Target, PlusCircle } from "lucide-react";
import { db } from "@/lib/storage";
import { EmptyState, formatBRL, formatDate } from "@/components/UI";
import Modal from "@/components/Modal";

function emptyForm() {
  return { name: "", target: "", current: "0", deadline: "" };
}

export default function MetasPage() {
  const [goals, setGoals] = useState([]);
  const [open, setOpen] = useState(false);
  const [contribOpen, setContribOpen] = useState(null);
  const [contribValue, setContribValue] = useState("");
  const [form, setForm] = useState(emptyForm());

  async function reload() {
    setGoals(await db.list("goals"));
  }

  useEffect(() => {
    (async () => {
      await db.init();
      await reload();
    })();
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (!form.name || !form.target) return;
    await db.add("goals", {
      name: form.name,
      target: Number(form.target),
      current: Number(form.current || 0),
      deadline: form.deadline,
    });
    await reload();
    setForm(emptyForm());
    setOpen(false);
  }

  async function remove(id) {
    await db.remove("goals", id);
    await reload();
  }

  async function addContribution(goal) {
    const value = Number(contribValue);
    if (!value) return;
    await db.update("goals", goal.id, { current: Math.min(goal.target, goal.current + value) });
    await reload();
    setContribValue("");
    setContribOpen(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setOpen(true)}>
          <Plus size={16} /> Nova meta
        </button>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Nenhuma meta cadastrada"
          description="Defina objetivos financeiros e acompanhe seu progresso."
          action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Nova meta</button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.current / g.target) * 100));
            const done = pct >= 100;
            return (
              <div key={g.id} className="card p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display font-semibold">{g.name}</p>
                    {g.deadline ? (
                      <p className="text-xs text-slate-400 dark:text-ink-faint mt-0.5">Até {formatDate(g.deadline)}</p>
                    ) : null}
                  </div>
                  <button onClick={() => remove(g.id)} className="text-slate-400 hover:text-negative" aria-label="Excluir">
                    <Trash2 size={15} />
                  </button>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium">{formatBRL(g.current)}</span>
                    <span className="text-slate-400 dark:text-ink-faint">{formatBRL(g.target)}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-light-border dark:bg-base-border overflow-hidden">
                    <div className={`h-full rounded-full ${done ? "bg-positive" : "bg-brand"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 dark:text-ink-faint mt-1.5">{pct}% concluído</p>
                </div>

                {done ? (
                  <span className="btn-ghost !cursor-default justify-center text-positive !border-positive/40">Meta concluída 🎉</span>
                ) : contribOpen === g.id ? (
                  <div className="flex gap-2">
                    <input
                      className="input"
                      type="number"
                      placeholder="Valor"
                      value={contribValue}
                      onChange={(e) => setContribValue(e.target.value)}
                      autoFocus
                    />
                    <button className="btn-primary !px-3" onClick={() => addContribution(g)}>OK</button>
                  </div>
                ) : (
                  <button className="btn-ghost justify-center" onClick={() => setContribOpen(g.id)}>
                    <PlusCircle size={15} /> Adicionar valor
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nova meta">
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            className="input"
            placeholder="Nome da meta"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className="input"
              type="number"
              placeholder="Valor alvo"
              value={form.target}
              onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
              required
            />
            <input
              className="input"
              type="number"
              placeholder="Valor já guardado"
              value={form.current}
              onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))}
            />
          </div>
          <input
            className="input"
            type="date"
            value={form.deadline}
            onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
          />
          <button type="submit" className="btn-primary mt-1">Salvar meta</button>
        </form>
      </Modal>
    </div>
  );
}
