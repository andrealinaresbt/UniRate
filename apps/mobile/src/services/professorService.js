// apps/mobile/src/services/professorService.js
import { supabase } from './supabaseClient';
import { requireSessionOrThrow } from './AuthService';

export const ProfessorService = {
  // ----- LISTADO / BÚSQUEDA / DETALLE -----
  async getAllProfessors() {
    try {
      const { data, error } = await supabase
        .from('professors')
        .select('*')
        .order('full_name');
      if (error) throw error;
      return { success: true, data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async listAll(q = '') {
    const term = (q ?? '').trim();
    if (!term) return this.getAllProfessors();
    return this.searchProfessors(term);
  },

  async searchProfessors(searchTerm) {
    try {
      const q = (searchTerm ?? '').trim();
      if (!q) return { success: true, data: [] };
      const { data, error } = await supabase
        .from('professors')
        .select('*')
        .ilike('full_name', `%${q}%`)
        .order('full_name')
        .limit(25);
      if (error) throw error;
      return { success: true, data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async getProfessorById(id) {
    try {
      const { data, error } = await supabase
        .from('professors')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // ----- REGLAS -----
  async checkDuplicate({ full_name, university }) {
    try {
      const { data, error } = await supabase
        .from('professors')
        .select('id')
        .eq('full_name', full_name)
        .eq('university', university)
        .maybeSingle();
      if (error) throw error;
      return { success: true, exists: !!data, id: data?.id || null };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async logAudit({ action, entity, entity_id, details }) {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          action,
          entity,
          entity_id,
          details,
          performed_at: new Date().toISOString(),
        });
      if (error) throw error;
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // ----- CRUD -----
  async createProfessor({ full_name, department, university }) {
    try {
      await requireSessionOrThrow();

      const dup = await this.checkDuplicate({ full_name, university });
      if (dup.success && dup.exists) {
        return { success: false, code: 'DUPLICATE', error: 'Profesor ya registrado' };
      }

      const insert = { full_name, department, university, avg_score: 0, avg_difficulty: 0, would_take_again_percentage: 0 };

      const { data, error } = await supabase
        .from('professors')
        .insert(insert)
        .select('id')
        .single();
      if (error) throw error;

      await this.logAudit({ action: 'CREATE', entity: 'professor', entity_id: data.id, details: insert });
      return { success: true, data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async updateProfessor(id, payload) {
    try {
      await requireSessionOrThrow();

      if (!payload?.full_name?.trim()) return { success: false, error: 'El nombre completo es requerido' };

      const current = await this.getProfessorById(id);
      if (current.success) {
        const candidate = { full_name: payload.full_name ?? current.data.full_name, university: payload.university ?? current.data.university };
        const dup = await this.checkDuplicate(candidate);
        if (dup.success && dup.exists && String(dup.id) !== String(id)) {
          return { success: false, code: 'DUPLICATE', error: 'Ya existe un profesor con ese nombre y universidad' };
        }
      }

      const { data, error } = await supabase
        .from('professors')
        .update({ full_name: payload.full_name, department: payload.department, university: payload.university })
        .eq('id', id)
        .select('id');
      if (error) throw error;

      if (!data || data.length === 0) return { success: false, error: 'No se aplicaron cambios (RLS/filtro).' };

      await this.logAudit({ action: 'UPDATE', entity: 'professor', entity_id: id, details: payload });
      return { success: true, data: { id } };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async deleteProfessorCascade(id) {
    try {
      await requireSessionOrThrow();

      const links = await supabase.from('professor_courses').delete().eq('professor_id', id).select('id');
      if (links.error) throw links.error;

      const reviews = await supabase.from('reviews').delete().eq('professor_id', id).select('id');
      if (reviews.error) throw reviews.error;

      const prof = await supabase.from('professors').delete().eq('id', id).select('id');
      if (prof.error) throw prof.error;
      if (!prof.data || prof.data.length === 0) return { success: false, error: 'No se eliminó el registro (RLS/filtro).' };

      await this.logAudit({ action: 'DELETE', entity: 'professor', entity_id: id, details: { cascade: true } });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },
};
