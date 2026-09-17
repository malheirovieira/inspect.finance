import { useCallback, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { identifyUser, resetAnalyticsIdentity } from '@/lib/analytics';
import type { Plan } from '@/types/database';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  plan: Plan;
}

/**
 * Único ponto de acesso ao supabase.auth no app — componentes nunca chamam
 * o Supabase diretamente (ver CLAUDE.md → Convenções Supabase).
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({ session: null, user: null, loading: true });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ session, user: session?.user ?? null, loading: false });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setState({ session, user: session?.user ?? null, loading: false });
      if (event === 'SIGNED_OUT') {
        resetAnalyticsIdentity();
      } else if (session?.user) {
        identifyUser(session.user.id, { email: session.user.email });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app` },
    });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async ({ email, password, fullName, plan }: SignUpParams) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, plan },
      },
    });
    if (error) throw error;
    // `data.session` só vem preenchido se "Confirm email" estiver desligado no projeto Supabase —
    // com confirmação obrigatória, o cadastro cria o usuário mas a sessão só existe depois do
    // clique no link do e-mail. Quem chama precisa saber disso pra decidir pra onde mandar a pessoa.
    return { hasSession: Boolean(data.session) };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw error;
  }, []);

  const resendVerificationEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw error;
  }, []);

  return {
    session: state.session,
    user: state.user,
    loading: state.loading,
    isAuthenticated: Boolean(state.user),
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    resetPassword,
    resendVerificationEmail,
  };
}
