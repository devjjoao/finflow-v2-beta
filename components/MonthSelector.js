"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  formatMonthLabel,
  getPreviousMonthKey,
  getNextMonthKey,
  getLocalCurrentMonthKey,
} from "@/lib/monthSummary";

export default function MonthSelector({
  value,
  onChange,
  className = "",
}) {
  const currentKey = getLocalCurrentMonthKey();
  const isCurrentMonth = value >= currentKey;

  function handlePrev() {
    const prev = getPreviousMonthKey(value);
    onChange(prev);
  }

  function handleNext() {
    if (isCurrentMonth) return;
    const next = getNextMonthKey(value);
    onChange(next);
  }

  return (
    <div
      className={`inline-flex items-center gap-1 p-1 rounded-xl bg-light-card dark:bg-base-soft border border-light-border dark:border-base-border shadow-sm select-none ${className}`}
    >
      <button
        type="button"
        onClick={handlePrev}
        className="p-1.5 rounded-lg text-slate-500 dark:text-ink-muted hover:text-slate-800 dark:hover:text-ink hover:bg-light-soft dark:hover:bg-base-card transition-colors focus-ring"
        aria-label="Mês anterior"
        title="Mês anterior"
      >
        <ChevronLeft size={16} />
      </button>

      <span className="px-2 text-xs md:text-sm font-semibold text-slate-800 dark:text-ink min-w-[120px] text-center">
        {formatMonthLabel(value)}
      </span>

      <button
        type="button"
        onClick={handleNext}
        disabled={isCurrentMonth}
        className={`p-1.5 rounded-lg transition-colors focus-ring ${
          isCurrentMonth
            ? "text-slate-300 dark:text-ink-faint/30 cursor-not-allowed opacity-50"
            : "text-slate-500 dark:text-ink-muted hover:text-slate-800 dark:hover:text-ink hover:bg-light-soft dark:hover:bg-base-card"
        }`}
        aria-label="Próximo mês"
        title={isCurrentMonth ? "Não é possível avançar para meses futuros" : "Próximo mês"}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
