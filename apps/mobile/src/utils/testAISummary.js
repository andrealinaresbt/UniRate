// apps/mobile/src/utils/testAISummary.js
/**
 * Script de prueba para verificar la integración de Gemini AI
 * Ejecutar desde la consola del navegador o agregar a una pantalla de test
 */

import { AISummaryService } from '../services/aiSummaryService';

/**
 * Test básico para verificar que Gemini está funcionando
 */
export async function testGeminiConnection() {
  console.log('🧪 Iniciando test de conexión con Gemini...');
  
  // Datos de prueba (reseñas ficticias)
  const mockReviews = [
    {
      id: '1',
      calidad: 5,
      dificultad: 3,
      comentario: 'Excelente profesor, explica muy bien los conceptos. Las clases son dinámicas.',
      volveria: true
    },
    {
      id: '2',
      calidad: 4,
      dificultad: 4,
      comentario: 'Buen profesor pero los exámenes son difíciles. Se aprende mucho.',
      volveria: true
    },
    {
      id: '3',
      calidad: 3,
      dificultad: 5,
      comentario: 'La materia es muy complicada. El profesor conoce pero va muy rápido.',
      volveria: false
    }
  ];

  try {
    console.log('📝 Generando resumen con', mockReviews.length, 'reseñas...');
    
    const result = await AISummaryService._generateProfessorSummary(mockReviews);
    
    console.log('✅ Test exitoso!');
    console.log('📄 Resumen generado:', result);
    
    return {
      success: true,
      summary: result,
      message: 'Gemini está funcionando correctamente'
    };
  } catch (error) {
    console.error('❌ Test falló:', error);
    
    return {
      success: false,
      error: error.message,
      message: 'Error al conectar con Gemini'
    };
  }
}

/**
 * Test de caché de base de datos
 */
export async function testDatabaseCache(entityType = 'professor', entityId = 'test-id-123') {
  console.log('🧪 Testeando caché de base de datos...');
  
  const testSummary = 'Este es un resumen de prueba generado por el test.';
  
  try {
    // 1. Guardar resumen
    console.log('💾 Guardando resumen en BD...');
    await AISummaryService._saveSummary(entityType, entityId, testSummary, 3);
    console.log('✅ Resumen guardado');
    
    // 2. Recuperar resumen
    console.log('📥 Recuperando resumen de BD...');
    const cached = await AISummaryService._getCachedSummary(entityType, entityId);
    
    if (cached && cached.summary_text === testSummary) {
      console.log('✅ Caché funcionando correctamente');
      console.log('📄 Resumen recuperado:', cached);
      
      // 3. Limpiar
      console.log('🧹 Limpiando datos de prueba...');
      await AISummaryService.deleteSummary(entityType, entityId);
      console.log('✅ Limpieza completa');
      
      return {
        success: true,
        message: 'Caché de BD funcionando correctamente'
      };
    } else {
      throw new Error('El resumen recuperado no coincide con el guardado');
    }
  } catch (error) {
    console.error('❌ Test de caché falló:', error);
    
    return {
      success: false,
      error: error.message,
      message: 'Error en el sistema de caché'
    };
  }
}

/**
 * Test completo del sistema
 */
export async function runFullTest() {
  console.log('🚀 Ejecutando batería completa de tests...\n');
  
  const results = {
    gemini: await testGeminiConnection(),
    cache: await testDatabaseCache()
  };
  
  console.log('\n📊 RESULTADOS DE TESTS:');
  console.log('Gemini API:', results.gemini.success ? '✅' : '❌');
  console.log('Caché BD:', results.cache.success ? '✅' : '❌');
  
  const allPassed = results.gemini.success && results.cache.success;
  
  if (allPassed) {
    console.log('\n🎉 ¡Todos los tests pasaron! El sistema está listo.');
  } else {
    console.log('\n⚠️ Algunos tests fallaron. Revisa los errores arriba.');
  }
  
  return {
    success: allPassed,
    details: results
  };
}

// Para usar desde la consola del navegador:
// import { runFullTest } from './utils/testAISummary';
// runFullTest();
