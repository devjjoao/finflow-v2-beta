"use client";

export function StatCard({ icon: Icon, label, value, accent = "brand", sub }) {
  const accentMap = {
    brand: "bg-brand/15 text-brand",
    positive: "bg-positive/15 text-positive",
    negative: "bg-negative/15 text-negative",
    warn: "bg-warn/15 text-warn",
  };
  return (
    <div className="card p-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-slate-400 dark:text-ink-faint mb-1">{label}</p>
        <p className="font-display text-2xl font-bold tracking-tight">{value}</p>
        {sub ? <p className="text-xs text-slate-400 dark:text-ink-faint mt-1">{sub}</p> : null}
      </div>
      {Icon ? (
        <span className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${accentMap[accent]}`}>
          <Icon size={18} />
        </span>
      ) : null}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="card p-10 flex flex-col items-center justify-center text-center gap-3">
      {Icon ? (
        <span className="flex items-center justify-center w-12 h-12 rounded-full bg-brand/10 text-brand">
          <Icon size={22} />
        </span>
      ) : null}
      <h4 className="font-display font-semibold">{title}</h4>
      {description ? <p className="text-sm text-slate-500 dark:text-ink-muted max-w-sm">{description}</p> : null}
      {action}
    </div>
  );
}

export function formatBRL(value) {
  return (value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
