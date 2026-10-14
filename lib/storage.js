"use client";

// -----------------------------------------------------------------------
// FinFlow - camada de dados via Supabase
//
// Mantém a mesma "API" que o resto do app já usava com o localStorage
// (db.list / db.add / db.update / db.remove / db.uid / db.init), só que
// agora cada método é assíncrono e conversa com o Supabase por baixo dos
// panos. Assim nenhuma página precisou mudar a forma como usa `db` além
// de adicionar `await` nas chamadas.
// -----------------------------------------------------------------------

import { supabase } from "./supabaseClient";

// Nome das tabelas no Supabase (rode supabase/schema.sql para criá-las).
const TABLES = {
  transactions: "transactions",
  cards: "cards",
  invoices: "invoices",
  budgets: "budgets",
  goals: "goals",
  investments: "investments",
  changelog: "changelog",
};

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ---- Conversão camelCase (app) <-> snake_case (colunas do Postgres) ----

function toSnakeKey(key) {
  return key.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());
}

function toCamelKey(key) {
  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function toSnakeObj(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[toSnakeKey(k)] = v;
  return out;
}

function toCamelObj(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[toCamelKey(k)] = v;
  return out;
}

function tableOf(key) {
  const table = TABLES[key];
  if (!table) throw new Error(`[supabase] tabela desconhecida: "${key}"`);
  return table;
}

// ---- API genérica (mesmo formato do antigo lib/storage.js local) ------

export const db = {
  uid,

  // Não seeda mais nada automaticamente (os dados de exemplo agora ficam
  // em supabase/seed.sql, rode manualmente se quiser popular o banco).
  // Mantido só para não quebrar o `db.init()` chamado nas páginas.
  async init() {
    return true;
  },

  async list(key) {
    const { data, error } = await supabase
      .from(tableOf(key))
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(`[supabase] erro ao listar "${key}":`, error.message);
      return [];
    }
    return (data || []).map(toCamelObj);
  },

  async add(key, item) {
    const payload = toSnakeObj({ id: uid(), ...item });
    const { data, error } = await supabase
      .from(tableOf(key))
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error(`[supabase] erro ao adicionar em "${key}":`, error.message);
      return null;
    }
    return toCamelObj(data);
  },

  async update(key, id, patch) {
    const { error } = await supabase
      .from(tableOf(key))
      .update(toSnakeObj(patch))
      .eq("id", id);

    if (error) {
      console.error(`[supabase] erro ao atualizar "${key}":`, error.message);
    }
    return db.list(key);
  },

  async remove(key, id) {
    const { error } = await supabase.from(tableOf(key)).delete().eq("id", id);

    if (error) {
      console.error(`[supabase] erro ao remover de "${key}":`, error.message);
    }
    return db.list(key);
  },

  // Checa se o usuário logado está na tabela app_admins (só isso libera
  // criar/apagar novidades no changelog — ver supabase/migration_changelog.sql).
  async isAdmin() {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) return false;

    const { data, error } = await supabase
      .from("app_admins")
      .select("user_id")
      .eq("user_id", uid)
      .maybeSingle();

    if (error) {
      console.error("[supabase] erro ao checar admin:", error.message);
      return false;
    }
    return !!data;
  },
};

export { TABLES as KEYS };
