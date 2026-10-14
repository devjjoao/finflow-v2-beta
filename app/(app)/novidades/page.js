"use client";

import { useEffect, useState } from "react";
import { Sparkles, Plus, Trash2, ShieldCheck } from "lucide-react";
import { db } from "@/lib/storage";
import { TAGS, markChangelogRead } from "@/lib/changelog";
import { EmptyState, formatDate } from "@/components/UI";
import Modal from "@/components/Modal";

function emptyForm() {
  return { title: "", tag: "novo", itemsText: "" };
}

export default function NovidadesPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());

  async function reload() {
    const [entries, admin] = await Promise.all([db.list("changelog"), db.isAdmin()]);
    setList(entries);
    setIsAdmin(admin);
    setLoading(false);
    return entries;
  }

  useEffect(() => {
    (async () => {
      const entries = await reload();
      // marca como lido só depois de renderizar, pra dar tempo de ver o
      // "flash" do contador antes de sumir do menu
      const t = setTimeout(() => markChangelogRead(entries), 400);
      return () => clearTimeout(t);
    })();
  }, []);

  async function submit(e) {
    e.preventDefault();
    const items = form.itemsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (!form.title || items.length === 0) return;

    setSaving(true);
    try {
      await db.add("changelog", { title: form.title, tag: form.tag, items });
      const entries = await reload();
      markChangelogRead(entries);
      setForm(emptyForm());
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    await db.remove("changelog", id);
    reload();
  }

  if (loading) return null;

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand/15 text-brand shrink-0">
            <Sparkles size={17} />
          </span>
          <h1 className="font-display text-xl font-bold">Novidades do FinFlow</h1>
        </div>
        {isAdmin ? (
          <button className="btn-primary shrink-0" onClick={() => setOpen(true)}>
            <Plus size={16} /> Nova novidade
          </button>
        ) : null}
      </div>
      <p className="text-sm text-slate-500 dark:text-ink-muted mb-2 pl-12">
        Tudo que mudou no app, mais recente primeiro.
      </p>
      {isAdmin ? (
        <p className="text-xs text-brand flex items-center gap-1.5 mb-8 pl-12">
          <ShieldCheck size={13} /> Sua conta pode postar novidades
        </p>
      ) : (
        <div className="mb-8" />
      )}

      {list.length === 0 ? (
        <div className="pl-12">
          <EmptyState
            icon={Sparkles}
            title="Nenhuma novidade ainda"
            description={
              isAdmin
                ? "Poste a primeira atualização pra quem usa o FinFlow ficar por dentro."
                : "Quando sair uma atualização do FinFlow, ela aparece por aqui."
            }
            action={
              isAdmin ? (
                <button className="btn-primary" onClick={() => setOpen(true)}>
                  <Plus size={16} /> Nova novidade
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <ol className="relative pl-12">
          <span className="absolute left-[22px] top-1 bottom-1 w-px bg-light-border dark:bg-base-border" />

          {list.map((entry, i) => {
            const tag = TAGS[entry.tag] || TAGS.novo;
            return (
              <li
                key={entry.id}
                className="relative pb-8 last:pb-0 animate-entry"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <span className="absolute -left-12 top-1 w-[13px] h-[13px] rounded-full bg-base-soft dark:bg-base border-2 border-brand shadow-glow" />

                <div className="card p-5 group">
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${tag.className}`}>
                        {tag.label}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-ink-faint">
                        {formatDate((entry.createdAt || "").slice(0, 10))}
                      </span>
                    </div>
                    {isAdmin ? (
                      <button
                        onClick={() => remove(entry.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-negative transition-opacity"
                        aria-label="Excluir novidade"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : null}
                  </div>
                  <h3 className="font-display font-semibold text-[15px] mb-2">{entry.title}</h3>
                  <ul className="flex flex-col gap-1.5">
                    {(entry.items || []).map((text, idx) => (
                      <li key={idx} className="text-sm text-slate-600 dark:text-ink-muted flex gap-2">
                        <span className="text-brand mt-1.5 w-1 h-1 rounded-full bg-brand shrink-0" />
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nova novidade">
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            className="input"
            placeholder="Título (ex: Filtro de faturas por cartão)"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />

          <select
            className="input"
            value={form.tag}
            onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
          >
            <option value="novo">Novidade</option>
            <option value="melhoria">Melhoria</option>
            <option value="correcao">Correção</option>
          </select>

          <textarea
            className="input min-h-[100px] resize-y"
            placeholder={"Uma linha por item, ex:\nAgora dá pra filtrar faturas por cartão.\nCorrigido bug no gráfico de pizza."}
            value={form.itemsText}
            onChange={(e) => setForm((f) => ({ ...f, itemsText: e.target.value }))}
            required
          />
          <p className="text-xs text-slate-400 dark:text-ink-faint -mt-2">
            Cada linha vira um item na lista de novidades.
          </p>

          <button type="submit" className="btn-primary mt-1" disabled={saving}>
            {saving ? "Publicando..." : "Publicar novidade"}
          </button>
        </form>
      </Modal>

      <style jsx>{`
        @keyframes entryFade {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-entry {
          animation: entryFade 0.5s ease forwards;
        }
      `}</style>
    </div>
  );
}
