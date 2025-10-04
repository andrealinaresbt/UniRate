// services/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext({
  session: null,
  user: null,          // { id, email, ...perfil users (incluye has_unlimited_access) }
  loading: true,
  refreshUser: async () => {},
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function hydrateProfile(authUser) {
    if (!authUser) {
      setUser(null);
      return;
    }
    try {
      // 1) Intentar por id (lo más robusto si tu tabla users.id = auth.user.id)
      let { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      // 2) Si no hay fila por id, intentar por email (para casos antiguos o si el id no coincide)
      if ((error || !profile) && authUser.email) {
        const { data: byEmail, error: e2 } = await supabase
          .from('users')
          .select('*')
          .ilike('email', authUser.email)
          .single();
        if (!e2 && byEmail) profile = byEmail;
      }

      // Mezclamos auth.user con el perfil (donde viene has_unlimited_access)
      setUser({
        id: authUser.id,
        email: authUser.email,
        ...profile, // => incluye has_unlimited_access, full_name, career, etc.
      });
    } catch (_e) {
      // Si algo falla, al menos exponemos el authUser
      setUser({ id: authUser.id, email: authUser.email });
    }
  }

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(session);
      await hydrateProfile(session?.user);
      if (mounted) setLoading(false);
    }

    init();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setLoading(true);
        setSession(session);
        await hydrateProfile(session?.user);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    loading,
    refreshUser: async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      await hydrateProfile(session?.user);
      setLoading(false);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
