"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, CheckCircle2, Circle } from "lucide-react";
import { db } from "@/lib/storage";
import { monthKey, currentMonthKey } from "@/lib/finance";
import { EmptyState, formatBRL, formatDate } from "@/components/UI";

export default function FaturasPage() {
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [paidState, setPaidState] = useState({});
  const [month, setMonth] = useState(currentMonthKey());

  useEffect(() => {
    (async () => {
      await db.init();
      const [c, t] = await Promise.all([db.list("cards"), db.list("transactions")]);
      setCards(c);
      setTransactions(t);
      const saved = JSON.parse(window.localStorage.getItem("finflow_invoice_paid") || "{}");
      setPaidState(saved);
    })();
  }, []);

  function togglePaid(key) {
    setPaidState((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      window.localStorage.setItem("finflow_invoice_paid", JSON.stringify(next));
      return next;
    });
  }

  const invoicesByCard = useMemo(() => {
    return cards.map((c) => {
      const items = transactions.filter(
        (t) => t.cardId === c.id && t.type === "saida" && monthKey(t.date) === month
      );
      const total = items.reduce((a, t) => a + Number(t.amount || 0), 0);
      return { card: c, items, total };
    });
  }, [cards, transactions, month]);

  const monthOptions = useMemo(() => {
    const set = new Set(transactions.filter((t) => t.cardId).map((t) => monthKey(t.date)));
    set.add(currentMonthKey());
    return Array.from(set).sort().reverse();
  }, [transactions]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <label className="text-xs text-slate-400 dark:text-ink-faint">Referência:</label>
        <select className="input !w-44" value={month} onChange={(e) => setMonth(e.target.value)}>
          {monthOptions.map((m) => (
            <option key={m} value={m}>
              {new Date(`${m}-01T00:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </option>
          ))}
        </select>
      </div>

      {cards.length === 0 ? (
        <EmptyState icon={FileText} title="Nenhum cartão cadastrado" description="Cadastre um cartão na aba Meus Cartões para ver faturas aqui." />
      ) : (
        <div className="flex flex-col gap-4">
          {invoicesByCard.map(({ card, items, total }) => {
            const key = `${card.id}-${month}`;
            const paid = !!paidState[key];
            return (
              <div key={card.id} className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg" style={{ background: card.color }} />
                    <div>
                      <p className="font-medium text-sm">{card.name}</p>
                      <p className="text-xs text-slate-400 dark:text-ink-faint">Vencimento dia {card.dueDay}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-lg">{formatBRL(total)}</p>
                    <button
                      onClick={() => togglePaid(key)}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium mt-1 ${paid ? "text-positive" : "text-slate-400 dark:text-ink-faint"}`}
                    >
                      {paid ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                      {paid ? "Fatura paga" : "Marcar como paga"}
                    </button>
                  </div>
                </div>

                {items.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-ink-faint">Sem lançamentos neste mês.</p>
                ) : (
                  <div className="flex flex-col divide-y divide-light-border dark:divide-base-border">
                    {items.map((t) => (
                      <div key={t.id} className="flex items-center justify-between py-2.5">
                        <div>
                          <p className="text-sm">{t.description}</p>
                          <p className="text-xs text-slate-400 dark:text-ink-faint">{t.category} · {formatDate(t.date)}</p>
                        </div>
                        <span className="text-sm font-medium">{formatBRL(t.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
