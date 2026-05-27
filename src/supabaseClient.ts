import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Supabase URL:', supabaseUrl ? 'Loaded' : 'Missing');
console.log('Supabase Key:', supabaseAnonKey ? 'Loaded' : 'Missing');

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

let supabaseClient: any;

if (isValidUrl(supabaseUrl) && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('Supabase credentials are not set or invalid. Running in Mock/Offline mode.');
  
  // A chainable mock to prevent runtime crashes when calling supabase.from().select().order() etc.
  const createMockChain = () => {
    const chain: any = {
      select: () => chain,
      order: () => chain,
      limit: () => chain,
      eq: () => chain,
      update: () => chain,
      insert: () => chain,
      delete: () => chain,
      // Thenable to support await directly
      then: (onfulfilled: any) => {
        return Promise.resolve(
          onfulfilled({ 
            data: [], 
            error: { message: 'Supabase URL is not configured. Running in offline mock mode.' } 
          })
        );
      }
    };
    return chain;
  };

  supabaseClient = {
    from: () => createMockChain(),
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    }
  };
}

export const supabase = supabaseClient;
