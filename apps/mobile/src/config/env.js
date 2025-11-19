// apps/mobile/src/config/env.js
/**
 * Configuración de variables de entorno
 * IMPORTANTE: En producción, estas claves deberían estar en variables de entorno reales
 * o en un archivo .env que NO se suba a git
 */

export const ENV = {
  // Supabase
  SUPABASE_URL: 'https://hsiwcusolcaicuxhnkcb.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzaXdjdXNvbGNhaWN1eGhua2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNjM4ODIsImV4cCI6MjA3NDgzOTg4Mn0.47wIP77NwDL01W3jAVFNTn4y8l7p8zmFt84kig3FVvo',

  // Google Gemini AI
  // Obtén tu API key gratuita en: https://makersuite.google.com/app/apikey
  GEMINI_API_KEY: 'AIzaSyB0rEnD9BWRmIQgf49-bWeTw1lVsHTPnLE',
};

// Validar que las variables requeridas estén presentes
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'GEMINI_API_KEY'];

requiredEnvVars.forEach((varName) => {
  if (!ENV[varName]) {
    console.warn(`⚠️ Variable de entorno faltante: ${varName}`);
  }
});
