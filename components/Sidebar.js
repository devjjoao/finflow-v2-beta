"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  FileText,
  PieChart,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useChangelogUnread } from "@/lib/changelog";
import { useAuth } from "@/lib/AuthContext";
import Avatar from "./Avatar";

const SECTIONS = [
  {
    label: "Principal",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/transacoes", label: "Transações", icon: ArrowLeftRight },
    ],
  },
  {
    label: "Cartões",
    items: [
      { href: "/cartoes", label: "Meus Cartões", icon: CreditCard },
      { href: "/faturas", label: "Faturas", icon: FileText },
    ],
  },
  {
    label: "Planejamento",
    items: [
      { href: "/orcamento", label: "Orçamento", icon: PieChart },
      { href: "/metas", label: "Metas", icon: CheckCircle2 },
    ],
  },
  {
    label: "Patrimônio",
    items: [
      { href: "/investimentos", label: "Investimentos", icon: TrendingUp },
    ],
  },
  {
    label: "Outros",
    items: [
      { href: "/novidades", label: "Novidades", icon: Sparkles },
    ],
  },
];

export default function Sidebar({ open: externalOpen, onClose: externalOnClose }) {
  const pathname = usePathname();

  const [internalOpen, setInternalOpen] = useState(false);
  const { user, profile } = useAuth();
  const unread = useChangelogUnread();
  const isControlled = typeof externalOpen === "boolean";
  const open = isControlled ? externalOpen : internalOpen;

  const handleClose = () => {
    if (isControlled) {
      if (externalOnClose) externalOnClose();
    } else {
      setInternalOpen(false);
    }
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "";

  useEffect(() => {
    handleClose();
  }, [pathname]);

  return (
    <>
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={handleClose}
        />
      )}

      <aside
        className={`
          fixed md:sticky top-0 z-50 md:z-0 h-screen w-64 shrink-0
          bg-light-soft dark:bg-base-soft border-r border-light-border dark:border-base-border
          transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="h-full flex flex-col overflow-y-auto py-6">
          <div className="flex items-center justify-between px-5 mb-6">
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight">
                <span className="text-brand">Fin</span>
                <span className="text-slate-800 dark:text-ink">Flow</span>
              </h1>
              <p className="text-[10px] tracking-[0.15em] text-slate-400 dark:text-ink-faint font-semibold mt-0.5">
                GESTÃO PESSOAL
              </p>
            </div>
            <button
              onClick={handleClose}
              className="md:hidden text-slate-400 dark:text-ink-faint hover:text-slate-800 dark:hover:text-ink"
              aria-label="Fechar menu"
            >
              <X size={18} />
            </button>
          </div>

          <div className="h-px bg-light-border dark:bg-base-border mb-4" />

          <nav className="flex-1 flex flex-col gap-5 px-3">
            {SECTIONS.map((section) => (
              <div key={section.label} className="flex flex-col gap-1">
                <span className="label-eyebrow mb-1">{section.label}</span>
                {section.items.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  const showBadge = item.href === "/novidades" && unread > 0;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                        transition-colors focus-ring
                        ${
                          active
                            ? "bg-brand/15 text-brand"
                            : "text-slate-500 dark:text-ink-muted hover:bg-light-card dark:hover:bg-base-card hover:text-slate-800 dark:hover:text-ink"
                        }
                      `}
                    >
                      <span
                        className={`
                          flex items-center justify-center w-7 h-7 rounded-lg shrink-0
                          ${active ? "bg-brand text-white" : "bg-light-card dark:bg-base-card text-slate-400 dark:text-ink-muted group-hover:text-brand"}
                        `}
                      >
                        <Icon size={15} />
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {showBadge ? (
                        <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-brand text-white text-[11px] font-semibold leading-none shadow-glow animate-pulse">
                          {unread}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {user ? (
            <div className="p-3 border-t border-light-border dark:border-base-border mt-auto">
              <Link
                href="/perfil"
                className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
                  pathname === "/perfil"
                    ? "bg-brand/15 text-brand"
                    : "hover:bg-light-card dark:hover:bg-base-card text-slate-700 dark:text-ink"
                }`}
              >
                <Avatar
                  src={profile?.avatar_url}
                  name={displayName}
                  email={user?.email}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate leading-tight">
                    {displayName || "Meu Perfil"}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-ink-faint truncate leading-tight">
                    {user?.email}
                  </p>
                </div>
              </Link>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}
