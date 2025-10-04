// apps/mobile/src/services/courseService.js
import { supabase } from './supabaseClient';

export const CourseService = {
  // Listado
  async getAllCourses() {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('name');
      if (error) throw error;
      return { success: true, data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // BÚSQUEDA (FIX .or correcto)
  async searchCourses(term) {
    try {
      const q = (term ?? '').trim();
      if (!q) return { success: true, data: [] };

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .or(`name.ilike.%${q}%,code.ilike.%${q}%`)
        .order('name')
        .limit(25);

      if (error) throw error;
      return { success: true, data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // Detalle
  async getCourseById(id) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // --- Duplicados ---
  async checkDuplicate({ code, name, department }) {
    try {
      // por código
      const { data: byCode, error: e1 } = await supabase
        .from('courses')
        .select('id')
        .ilike('code', code)
        .maybeSingle();
      if (e1) throw e1;
      if (byCode) return { success: true, exists: true, reason: 'code' };

      // por (nombre + departamento)
      const { data: byTuple, error: e2 } = await supabase
        .from('courses')
        .select('id')
        .eq('department', department)
        .ilike('name', name)
        .maybeSingle();
      if (e2) throw e2;

      return { success: true, exists: !!byTuple, reason: byTuple ? 'name+department' : null };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // --- Auditoría (best-effort) ---
  async logAudit({ action, entity, entity_id, details }) {
    try {
      const { error } = await supabase.from('audit_logs').insert({
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

  // Crear
  async createCourse({ code, name, department }) {
    try {
      // pre-check duplicado
      const dup = await CourseService.checkDuplicate({ code, name, department });
      if (dup.success && dup.exists) {
        return {
          success: false,
          code: 'DUPLICATE',
          error:
            dup.reason === 'code'
              ? 'Código de materia ya registrado'
              : 'Materia ya registrada para ese departamento',
        };
      }

      const insert = { code, name, department };
      const { data, error } = await supabase
        .from('courses')
        .insert(insert)
        .select('id, code, name, department')
        .single();

      if (error) {
        // @ts-ignore (SupabaseError)
        if (error.code === '23505') {
          return { success: false, code: 'DUPLICATE', error: 'Materia duplicada' };
        }
        throw error;
      }

      await CourseService.logAudit({
        action: 'CREATE',
        entity: 'course',
        entity_id: data.id,
        details: insert,
      });

      return { success: true, data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },
};

