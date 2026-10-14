"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "./supabaseClient";
import { getProfile } from "./profile";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = ainda carregando
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    setLoadingProfile(true);
    try {
      const data = await getProfile(userId);
      setProfile(data);
    } catch (err) {
      console.error("[AuthContext] erro ao carregar perfil:", err);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        fetchProfile(data.session.user.id);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) {
      await fetchProfile(session.user.id);
    }
  }, [session?.user?.id, fetchProfile]);

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loadingProfile,
    refreshProfile,
    loading: session === undefined,

    async signInWithPassword(email, password) {
      return supabase.auth.signInWithPassword({ email, password });
    },

    async signUp(email, password) {
      return supabase.auth.signUp({ email, password });
    },

    async signInWithGoogle() {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined;
      return supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    },

    async resetPassword(email) {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;
      return supabase.auth.resetPasswordForEmail(email, { redirectTo });
    },

    async signOut() {
      setProfile(null);
      return supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
