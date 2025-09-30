import { createClient } from '@supabase/supabase-js';

// Obtén estas credenciales de Settings → API en Supabase
const supabaseUrl = 'https://hsiwcusolcaicuxhnkcb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzaXdjdXNvbGNhaWN1eGhua2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNjM4ODIsImV4cCI6MjA3NDgzOTg4Mn0.47wIP77NwDL01W3jAVFNTn4y8l7p8zmFt84kig3FVvo';

// Cliente sin autenticación - solo lectura pública
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Función para probar la conexión
export const testConnection = async () => {
  try {
    console.log('🔗 Probando conexión a Supabase...');
    
    const { data, error } = await supabase
      .from('professors')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error de conexión:', error.message);
      return false;
    }

    console.log('✅ Conexión exitosa!');
    return true;
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return false;
  }
};