import { createClient } from '@supabase/supabase-js';

// Helper to get env vars safely
const getEnv = (key: string) => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
}

// Use environment variables first, fallback to the previously provided placeholder if needed for dev
// Important: Replace these with your real Supabase project details in your Vercel Project Settings!
const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('REACT_APP_SUPABASE_URL') || 'https://lqaqknottfkzcpjmobvs.supabase.co';
const supabaseKey = getEnv('VITE_SUPABASE_KEY') || getEnv('REACT_APP_SUPABASE_KEY') || 'sb_publishable_HXJxP57J9xhxeI5GciCoYw_yktYIOTC';

// Initialize the client.
// Note: If keys are invalid, calls will fail, but the app should initialize.
export const supabase = createClient(supabaseUrl, supabaseKey);