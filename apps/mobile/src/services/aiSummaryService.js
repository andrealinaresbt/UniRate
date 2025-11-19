// apps/mobile/src/services/aiSummaryService.js
import { supabase } from './supabaseClient';
import { ENV } from '../config/env';

// URL de la API de Gemini (usando v1 con gemini-2.0-flash que es gratis)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent';

export const AISummaryService = {
  /**
   * Obtiene o genera un resumen para un profesor
   * @param {string} professorId - ID del profesor
   * @param {Array} reviews - Array de reseñas del profesor
   * @param {boolean} forceRegenerate - Forzar regeneración aunque exista caché
   * @returns {Promise<{success: boolean, summary?: string, error?: string}>}
   */
  async getProfessorSummary(professorId, reviews, forceRegenerate = false) {
    try {
      // 1. Verificar si hay suficientes reseñas (mínimo 3 para generar resumen)
      if (!reviews || reviews.length < 3) {
        return {
          success: true,
          summary: null,
          message: 'Se necesitan al menos 3 reseñas para generar un resumen'
        };
      }

      // 2. Intentar obtener resumen cacheado (si no se fuerza regeneración)
      if (!forceRegenerate) {
        const cached = await this._getCachedSummary('professor', professorId);
        if (cached) {
          // Verificar si el caché es reciente (menos de 7 días) y tiene el mismo # de reseñas
          const cacheAge = Date.now() - new Date(cached.updated_at).getTime();
          const sevenDays = 7 * 24 * 60 * 60 * 1000;
          
          if (cacheAge < sevenDays && cached.review_count === reviews.length) {
            return { success: true, summary: cached.summary_text, cached: true };
          }
        }
      }

      // 3. Generar nuevo resumen con Gemini
      const summary = await this._generateProfessorSummary(reviews);
      
      // 4. Guardar en caché
      await this._saveSummary('professor', professorId, summary, reviews.length);
      
      return { success: true, summary, cached: false };
    } catch (error) {
      console.error('Error getting professor summary:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtiene o genera un resumen para un curso
   * @param {string} courseId - ID del curso
   * @param {Array} reviews - Array de reseñas del curso
   * @param {boolean} forceRegenerate - Forzar regeneración
   * @returns {Promise<{success: boolean, summary?: string, error?: string}>}
   */
  async getCourseSummary(courseId, reviews, forceRegenerate = false) {
    try {
      if (!reviews || reviews.length < 3) {
        return {
          success: true,
          summary: null,
          message: 'Se necesitan al menos 3 reseñas para generar un resumen'
        };
      }

      if (!forceRegenerate) {
        const cached = await this._getCachedSummary('course', courseId);
        if (cached) {
          const cacheAge = Date.now() - new Date(cached.updated_at).getTime();
          const sevenDays = 7 * 24 * 60 * 60 * 1000;
          
          if (cacheAge < sevenDays && cached.review_count === reviews.length) {
            return { success: true, summary: cached.summary_text, cached: true };
          }
        }
      }

      const summary = await this._generateCourseSummary(reviews);
      await this._saveSummary('course', courseId, summary, reviews.length);
      
      return { success: true, summary, cached: false };
    } catch (error) {
      console.error('Error getting course summary:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Genera resumen de profesor usando Gemini
   * @private
   */
  async _generateProfessorSummary(reviews) {
    // Formatear reseñas para el prompt
    const reviewsText = reviews.map((r, idx) => {
      const calidad = r.calidad || r.score || 0;
      const dificultad = r.dificultad || r.difficulty || 0;
      const comentario = r.comentario || r.comment || '';
      const volveria = r.volveria || r.would_take_again;
      
      return `Reseña ${idx + 1}:
★ Puntuación: ${calidad}/5
📊 Dificultad: ${dificultad}/5
🔄 Volvería a tomar: ${volveria ? 'Sí' : 'No'}
💬 Comentario: ${comentario}`;
    }).join('\n\n');

    const prompt = `Eres un asistente que resume reseñas de profesores universitarios. Analiza las siguientes ${reviews.length} reseñas y genera un resumen conciso y útil.

RESEÑAS:
${reviewsText}

INSTRUCCIONES:
- Escribe un resumen en español de 3-4 oraciones (máximo 150 palabras)
- Menciona el estilo de enseñanza del profesor
- Indica el nivel de dificultad general de sus clases
- Destaca los aspectos más mencionados (tanto positivos como negativos)
- Sé objetivo y equilibrado
- No menciones nombres ni detalles personales de estudiantes
- Usa un tono profesional pero amigable

RESUMEN:`;

    // Llamada directa a la API REST de Gemini
    const response = await fetch(`${GEMINI_API_URL}?key=${ENV.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
  },

  /**
   * Genera resumen de curso usando Gemini
   * @private
   */
  async _generateCourseSummary(reviews) {
    const reviewsText = reviews.map((r, idx) => {
      const calidad = r.calidad || r.score || 0;
      const dificultad = r.dificultad || r.difficulty || 0;
      const comentario = r.comentario || r.comment || '';
      const volveria = r.volveria || r.would_take_again;
      
      return `Reseña ${idx + 1}:
★ Satisfacción: ${calidad}/5
📊 Dificultad: ${dificultad}/5
🔄 Recomendado: ${volveria ? 'Sí' : 'No'}
💬 Comentario: ${comentario}`;
    }).join('\n\n');

    const prompt = `Eres un asistente que resume reseñas de materias universitarias. Analiza las siguientes ${reviews.length} reseñas y genera un resumen conciso.

RESEÑAS:
${reviewsText}

INSTRUCCIONES:
- Escribe un resumen en español de 3-4 oraciones (máximo 150 palabras)
- Describe la naturaleza y contenido general del curso
- Indica el nivel de dificultad y carga de trabajo
- Menciona qué tipo de estudiantes podrían disfrutar o tener éxito en este curso
- Destaca aspectos positivos y desafíos comunes
- Sé objetivo y equilibrado
- Usa un tono profesional pero amigable

RESUMEN:`;

    // Llamada directa a la API REST de Gemini
    const response = await fetch(`${GEMINI_API_URL}?key=${ENV.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
  },

  /**
   * Obtiene resumen cacheado de la base de datos
   * @private
   */
  async _getCachedSummary(entityType, entityId) {
    try {
      const { data, error } = await supabase
        .from('ai_summaries')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No encontrado
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching cached summary:', error);
      return null;
    }
  },

  /**
   * Guarda resumen en la base de datos
   * @private
   */
  async _saveSummary(entityType, entityId, summaryText, reviewCount) {
    try {
      const { data, error } = await supabase
        .from('ai_summaries')
        .upsert({
          entity_type: entityType,
          entity_id: entityId,
          summary_text: summaryText,
          review_count: reviewCount,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'entity_type,entity_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving summary:', error);
      throw error;
    }
  },

  /**
   * Elimina resumen cacheado (útil para admin o cuando se elimina una entidad)
   */
  async deleteSummary(entityType, entityId) {
    try {
      const { error } = await supabase
        .from('ai_summaries')
        .delete()
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting summary:', error);
      return { success: false, error: error.message };
    }
  }
};
