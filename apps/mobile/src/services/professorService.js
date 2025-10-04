import { supabase } from './supabaseClient';

export const ProfessorService = {
  // Listado
  getAllProfessors: async () => {
    try {
      const { data, error } = await supabase
        .from('professors')
        .select('*')
        .order('full_name');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Búsqueda
  searchProfessors: async (searchTerm) => {
    try {
      const { data, error } = await supabase
        .from('professors')
        .select('*')
        .ilike('full_name', `%${searchTerm}%`)
        .order('full_name');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Detalle
  getProfessorById: async (professorId) => {
    try {
      const { data, error } = await supabase
        .from('professors')
        .select('*')
        .eq('id', professorId)
        .single();
    if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // --- NUEVO: verificar duplicados (full_name + university) ---
  checkDuplicate: async ({ full_name, university }) => {
    try {
      const { data, error } = await supabase
        .from('professors')
        .select('id')
        .eq('full_name', full_name)
        .eq('university', university)
        .maybeSingle();
      if (error) throw error;
      return { success: true, exists: !!data, id: data?.id || null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // --- NUEVO: auditoría simple ---
  logAudit: async ({ action, entity, entity_id, details }) => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          action,
          entity,
          entity_id,
          details,           // JSON
          performed_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      // la auditoría no debe romper el flujo
      return { success: false, error: error.message };
    }
  },

  // Crear profesor
  createProfessor: async ({ full_name, department, university }) => {
    try {
      // 1) pre-check de duplicado
      const dup = await ProfessorService.checkDuplicate({ full_name, university });
      if (dup.success && dup.exists) {
        return { success: false, code: 'DUPLICATE', error: 'Profesor ya registrado' };
      }

      // 2) insert
      const insert = {
        full_name,
        department: department || null,
        university: university || null,
        avg_score: 0,
        avg_difficulty: 0,
        would_take_again_percentage: 0,
      };

      const { data, error } = await supabase
        .from('professors')
        .insert(insert)
        .select('id, full_name, university')
        .single();

      // 3) si hay unique index y fue duplicado por carrera, capturamos 23505
      if (error) {
        // @ts-ignore (SupabaseError tiene code)
        if (error.code === '23505') {
          return { success: false, code: 'DUPLICATE', error: 'Profesor ya registrado' };
        }
        throw error;
      }

      // 4) auditoría (best-effort)
      await ProfessorService.logAudit({
        action: 'CREATE',
        entity: 'professor',
        entity_id: data.id,
        details: { full_name, department, university },
      });

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message || String(error) };
    }
  },
};
