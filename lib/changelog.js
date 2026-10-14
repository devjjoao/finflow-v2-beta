"use client";

import { useCallback, useEffect, useState } from "react";
import { db } from "./storage";
import { supabase } from "./supabaseClient";

// -----------------------------------------------------------------------
// Changelog do FinFlow — agora vem do Supabase (tabela `changelog`).
//
// Quem estiver na tabela app_admins vê o botão de "Nova novidade" na
// aba Novidades e pode postar direto pelo app, sem tocar em código.
// Veja supabase/migration_changelog.sql pra criar as tabelas e se
// tornar admin.
//
// O contador de "não lidas" compara o created_at mais recente do banco
// com o último created_at que a pessoa já viu (guardado no localStorage
// do aparelho dela).
// -----------------------------------------------------------------------

export const TAGS = {
  novo: { label: "Novidade", className: "bg-brand/15 text-brand" },
  melhoria: { label: "Melhoria", className: "bg-positive/15 text-positive" },
  correcao: { label: "Correção", className: "bg-warn/15 text-warn" },
};

const STORAGE_KEY = "finflow_changelog_last_seen_at";
const EVENT_NAME = "finflow:changelog-read";

function getLastSeen() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

// Chame passando a lista já carregada (evita buscar de novo no Supabase).
export function markChangelogRead(list) {
  if (typeof window === "undefined" || !list?.length) return;
  const latest = list.reduce((max, e) => (e.createdAt > max ? e.createdAt : max), "");
  if (!latest) return;
  window.localStorage.setItem(STORAGE_KEY, latest);
  window.dispatchEvent(new Event(EVENT_NAME));
}

// Hook pra Sidebar (ou qualquer componente) mostrar quantas novidades
// ainda não foram vistas, atualizando na hora quando a pessoa lê.
export function useChangelogUnread() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    const list = await db.list("changelog");
    const lastSeen = getLastSeen();
    const unread = lastSeen ? list.filter((e) => e.createdAt > lastSeen).length : list.length;
    setCount(unread);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(EVENT_NAME, refresh);
    window.addEventListener("storage", refresh);

    // Tempo real: assim que um admin publica uma novidade nova, a
    // bolinha aparece na hora pra quem já está com o app aberto, sem
    // precisar recarregar a página. (Precisa da tabela `changelog`
    // estar com Realtime habilitado — veja migration_changelog.sql.)
    const channel = supabase
      .channel(`changelog-unread-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "changelog" }, () => {
        refresh();
      })
      .subscribe();
    return () => {
      window.removeEventListener(EVENT_NAME, refresh);
      window.removeEventListener("storage", refresh);
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return count;
}
