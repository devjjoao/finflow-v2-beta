"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sun, Moon, LogOut, User as UserIcon, ChevronDown, LayoutDashboard } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { useAuth } from "@/lib/AuthContext";
import { useChangelogUnread } from "@/lib/changelog";
import Avatar from "./Avatar";

const TITLES = {
  "/dashboard": "Dashboard",
  "/transacoes": "Transações",
  "/cartoes": "Meus Cartões",
  "/faturas": "Faturas",
  "/orcamento": "Orçamento",
  "/metas": "Metas",
  "/investimentos": "Investimentos",
  "/novidades": "Novidades",
  "/perfil": "Meu Perfil",
};

export default function Topbar({ onMenuClick }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, mounted } = useTheme();
  const { user, profile, signOut } = useAuth();
  const unread = useChangelogUnread();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const title = TITLES[pathname] || "FinFlow";
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "";

  // Fecha o dropdown ao clicar fora ou ao trocar de rota
  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  async function handleSignOut() {
    setDropdownOpen(false);
    await signOut();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 h-16 border-b border-light-border dark:border-base-border bg-light/80 dark:bg-base/80 backdrop-blur">
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Mobile menu trigger dentro do header fixo */}
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden w-10 h-10 shrink-0 inline-flex items-center justify-center rounded-full bg-light-card dark:bg-base-card border border-light-border dark:border-base-border shadow-sm focus-ring relative"
          style={{ isolation: "isolate" }}
          aria-label="Abrir menu de navegação"
        >
          <LayoutDashboard size={18} className="text-brand" />
          {unread > 0 ? (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-brand ring-2 ring-light dark:ring-base" />
          ) : null}
        </button>

        <h2 className="font-display font-semibold text-lg truncate">{title}</h2>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Alternar tema */}
        <button
          onClick={toggleTheme}
          className="btn-ghost !px-2.5 !py-2 focus-ring"
          aria-label="Alternar tema"
          title="Alternar tema claro/escuro"
        >
          {mounted && theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Menu do Avatar do Usuário */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1 rounded-full md:rounded-xl hover:bg-light-card dark:hover:bg-base-card transition-colors focus-ring"
            aria-expanded={dropdownOpen}
            aria-haspopup="menu"
            aria-label="Menu do usuário"
          >
            <Avatar
              src={profile?.avatar_url}
              name={displayName}
              email={user?.email}
              size="sm"
              className="ring-2 ring-light-border dark:ring-base-border"
            />
            {user?.email ? (
              <span className="hidden md:inline-flex flex-col text-left mr-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-ink max-w-[120px] truncate leading-tight">
                  {displayName || user.email.split("@")[0]}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-ink-faint max-w-[120px] truncate leading-tight">
                  {user.email}
                </span>
              </span>
            ) : null}
            <ChevronDown
              size={14}
              className={`hidden md:block text-slate-400 dark:text-ink-faint transition-transform duration-200 ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 rounded-xl bg-light-soft dark:bg-base-soft border border-light-border dark:border-base-border shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
            >
              <div className="px-3.5 py-2.5 border-b border-light-border dark:border-base-border">
                <p className="text-xs font-semibold text-slate-800 dark:text-ink truncate">
                  {displayName || "Usuário FinFlow"}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-ink-faint truncate mt-0.5">
                  {user?.email}
                </p>
              </div>

              <div className="py-1">
                <Link
                  href="/perfil"
                  role="menuitem"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 dark:text-ink hover:bg-brand/10 hover:text-brand transition-colors"
                >
                  <UserIcon size={16} />
                  <span>Meu Perfil</span>
                </Link>
              </div>

              <div className="border-t border-light-border dark:border-base-border pt-1">
                <button
                  role="menuitem"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-negative hover:bg-negative/10 transition-colors text-left"
                >
                  <LogOut size={16} />
                  <span>Sair da conta</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
