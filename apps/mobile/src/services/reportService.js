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

      // Evitar que un mismo usuario reporte la misma reseña más de una vez
      try {
        const { data: existing, error: eCheck } = await supabase
          .from('reports')
          .select('id')
          .eq('review_id', payload.review_id)
          .eq('user_id', user.id)
          .maybeSingle();
        if (eCheck) {
          // si falla la verificación, continuamos (no bloqueamos por seguridad)
          console.warn('reportService.createReport: check existing report failed', eCheck);
        } else if (existing && existing.id) {
          return { success: false, error: 'Ya reportaste esta reseña' };
        }
      } catch (e) {
        console.warn('reportService.createReport: check existing exception', e);
      }

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

/**
 * Obtener reseñas que alcanzaron o superaron el umbral de reportes.
 * Devuelve cada reseña con su arreglo de reports para que el admin pueda revisarlos.
 */
export async function getFlaggedReviews() {
  try {
    // Traer reviews con reports anidados (contiene id, user_id, reason, comment, status)
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        reports(id, user_id, reason, comment, status),
        professors(id, full_name),
        courses(id, name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const rows = data || [];
    // contar reports por reseña y filtrar por umbral
    const out = rows
      .map(r => ({
        ...r,
        reports_count: Array.isArray(r.reports) ? r.reports.length : 0,
      }))
      .filter(r => (r.reports_count || 0) >= (require('./reviewService').REPORT_THRESHOLD || 3));

    return { success: true, data: out };
  } catch (e) {
    console.error('getFlaggedReviews error', e);
    return { success: false, error: e.message || String(e) };
  }
}

/**
 * Dismiss (mark as reviewed) all reports for a review so it becomes visible again.
 * Esto actualiza reports.status = 'dismissed' para la review dada.
 */
export async function dismissReportsForReview(reviewId) {
  if (!reviewId) return { success: false, error: 'reviewId required' };
  try {
    const { data, error } = await supabase
      .from('reports')
      .update({ status: 'dismissed' })
      .eq('review_id', reviewId);
    if (error) throw error;
    try { EventBus.emit('review:updated', { id: reviewId }); } catch (_) {}
    return { success: true, data };
  } catch (e) {
    console.error('dismissReportsForReview error', e);
    return { success: false, error: e.message || String(e) };
  }
}

/* =========================
   NUEVAS FUNCIONES PEDIDAS
   ========================= */

// Ajusta si tus nombres de columnas son otros:
const REPORT_REVIEW_FK = 'review_id'; // FK en reports
const REVIEW_HIDDEN_FIELD = 'hidden'; // boolean en reviews

// 1) Eliminar (DELETE) todos los reportes asociados a una reseña
export async function purgeReportsForReview(reviewId) {
  if (!reviewId) return { success: false, error: 'reviewId required' };
  try {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq(REPORT_REVIEW_FK, reviewId);
    if (error) throw error;
    try { EventBus.emit('review:updated', { id: reviewId }); } catch (_) {}
    return { success: true };
  } catch (e) {
    console.error('purgeReportsForReview error', e);
    return { success: false, error: e.message || String(e) };
  }
}

// 2) Volver visible la reseña (hidden = false)
export async function unhideReview(reviewId) {
  if (!reviewId) return { success: false, error: 'reviewId required' };
  try {
    const payload = { [REVIEW_HIDDEN_FIELD]: false };
    const { error } = await supabase
      .from('reviews')
      .update(payload)
      .eq('id', reviewId);
    if (error) throw error;
    try { EventBus.emit('review:updated', { id: reviewId }); } catch (_) {}
    return { success: true };
  } catch (e) {
    console.error('unhideReview error', e);
    return { success: false, error: e.message || String(e) };
  }
}

// 3) Eliminar definitivamente la reseña
export async function deleteReview(reviewId) {
  if (!reviewId) return { success: false, error: 'reviewId required' };
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);
    if (error) throw error;
    try { EventBus.emit('review:deleted', { id: reviewId }); } catch (_) {}
    return { success: true };
  } catch (e) {
    console.error('deleteReview error', e);
    return { success: false, error: e.message || String(e) };
  }
}
