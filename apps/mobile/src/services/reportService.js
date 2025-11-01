import { supabase } from './supabaseClient';

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