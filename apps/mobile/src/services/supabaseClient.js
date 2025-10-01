// services/supabaseClient.js
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://hsiwcusolcaicuxhnkcb.supabase.co';
const supabaseAnonKey = '...';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  // asegura fetch global en RN
  global: { fetch: (...args) => fetch(...args) },
});
