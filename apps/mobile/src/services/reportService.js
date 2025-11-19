import { supabase } from './supabaseClient';
import { EventBus } from '../utils/EventBus';

export const reportService = {
  /**
   * Crear reporte de reseña
   * payload: { review_id, reason, comment }
   */
  async createReport(payload = {}) {
    try {
      // verificar usuario autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return { success: false, error: 'No autenticado' };

      const row = {
        review_id: payload.review_id,
        user_id: user.id, 
        reason: payload.reason,
        comment: payload.comment || null,
        status: 'pending' 
      };

      const { data, error } = await supabase
        .from('reports') 
        .insert([row])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message || String(error) };
      }

      // Emitir un evento para que la UI refresque (por ejemplo para ocultar reseñas)
      try { EventBus.emit('review:updated', { id: row.review_id }); } catch (_) {}

      return { success: true, data };
    } catch (e) {
      return { success: false, error: e.message || String(e) };
    }
  },

  /**
   * Verificar si usuario ya reportó esta reseña
   */
  async checkUserReported(reviewId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return false;

      const { data, error } = await supabase
        .from('reports')  
        .select('id')
        .eq('review_id', reviewId)
        .eq('user_id', user.id) 
        .maybeSingle();

      return !!data;
    } catch (e) {
      console.error('Error checking user report:', e);
      return false;
    }
  }
};

export default reportService;

/**
 * Cuenta reports por review_id para una lista de reviews.
 * @param {Array<string|number>} reviewIds
 * @returns {Promise<Object>} mapa reviewId => count
 */
export async function countReportsFor(reviewIds = []) {
  if (!Array.isArray(reviewIds) || reviewIds.length === 0) return {};
  try {
    // Fallback implementation: count per id
    const out = {};
    for (const id of reviewIds) {
      const { data: d, error: e } = await supabase
        .from('reports')
        .select('id')
        .eq('review_id', id);
      if (!e && Array.isArray(d)) out[id] = d.length;
      else out[id] = 0;
    }
    return out;
  } catch (e) {
    console.error('countReportsFor error', e);
    return {};
  }
}