import { createClient } from '@supabase/supabase-js';

// Mocks configuration since URL and KEY are not available yet
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ====== MOCK DATA PARA LA VISTA ======
// Exportaremos funciones que simulan llamadas a la BD mientras tanto

export const mockAuth = {
  getUser: async () => {
    if (typeof window !== 'undefined') {
      const isLogged = localStorage.getItem('mock_logged_in');
      if (isLogged) return { data: { user: { id: 'mock-admin', email: 'admin@rifas.com' } }, error: null };
    }
    return { data: { user: null }, error: null };
  },
  signIn: async (email: string, password: string) => {
    if (email === 'admin@rifas.com' && password === 'admin123') {
      if (typeof window !== 'undefined') localStorage.setItem('mock_logged_in', 'true');
      return { data: { user: { id: 'mock-admin' } }, error: null };
    }
    return { data: null, error: { message: 'Credenciales inválidas (usa admin@rifas.com / admin123)' } };
  },
  signOut: async () => {
    if (typeof window !== 'undefined') localStorage.removeItem('mock_logged_in');
    return { error: null };
  }
};
