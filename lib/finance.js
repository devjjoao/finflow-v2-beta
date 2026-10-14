import { getLocalCurrentMonthKey } from "./monthSummary";

export function monthKey(iso) {
  return (iso || "").slice(0, 7);
}

export function currentMonthKey() {
  return getLocalCurrentMonthKey();
}

export function sumBy(items, predicate) {
  return items.filter(predicate).reduce((acc, it) => acc + Number(it.amount || 0), 0);
}

export function groupByCategory(transactions, type = "saida") {
  const map = {};
  transactions.forEach((t) => {
    if (t.type !== type) return;
    map[t.category] = (map[t.category] || 0) + Number(t.amount || 0);
  });
  return Object.entries(map).map(([category, total]) => ({ category, total }));
}

export function last6Months() {
  const arr = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    arr.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("pt-BR", { month: "short" }),
    });
  }
  return arr;
}

export function monthlySeries(transactions) {
  const months = last6Months();
  return months.map(({ key, label }) => {
    const entradas = sumBy(transactions, (t) => t.type === "entrada" && monthKey(t.date) === key);
    const saidas = sumBy(transactions, (t) => t.type === "saida" && monthKey(t.date) === key);
    return { name: label, Entradas: entradas, Saídas: saidas };
  });
}
