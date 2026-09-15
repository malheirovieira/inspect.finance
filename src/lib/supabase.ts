import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Não lança erro: permite rodar o app localmente (ex.: landing page) antes de
  // configurar o projeto Supabase. Chamadas de auth/dados falharão até o
  // .env.local ser preenchido — os formulários já tratam esse erro.
  console.warn(
    'Supabase não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.local para habilitar login/cadastro.',
  );
}

// Apenas a anon key é exposta no frontend — nunca a service_role (ver CLAUDE.md → Regras de Segurança).
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
);
