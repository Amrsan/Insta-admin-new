import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl ? 'Loaded' : 'Missing');
console.log('Supabase Key:', supabaseAnonKey ? 'Loaded' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in environment variables');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
