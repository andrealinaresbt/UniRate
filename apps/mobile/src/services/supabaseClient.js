// services/supabaseClient.js
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// credenciales Supabase
const supabaseUrl = 'https://hsiwcusolcaicuxhnkcb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzaXdjdXNvbGNhaWN1eGhua2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNjM4ODIsImV4cCI6MjA3NDgzOTg4Mn0.47wIP77NwDL01W3jAVFNTn4y8l7p8zmFt84kig3FVvo';


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
