import { createClient } from '@supabase/supabase-js';

// Load values from Vite environment variables or fallback to your provided credentials
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://cwgmmpqusvgaastqosot.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3Z21tcHF1c3ZnYWFzdHFvc290Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NTExNTksImV4cCI6MjA5NzEyNzE1OX0.dqt-sGvQpz7hb9wvPnhi3jGxTseOHvGTB3rgA1EGG0Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Utility functions to gracefully sync local state with Supabase database.
 * If tables do not exist yet in Supabase (the SQL schema hasn't been executed),
 * the app continues to operate flawlessly with local localStorage and logs warnings.
 */
