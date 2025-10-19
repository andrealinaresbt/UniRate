// apps/mobile/src/services/courseService.js
import { supabase } from './supabaseClient';
import { requireSessionOrThrow } from './AuthService';

export const CourseService = {
  // ---------- LISTADO / BÚSQUEDA / DETALLE ----------
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

  async listAll(q = '') {
    const term = (q ?? '').trim();
    if (!term) return CourseService.getAllCourses();
    return CourseService.searchCourses(term);
  },

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

  // ---------- REGLAS ----------
  async checkDuplicate({ code, name, department }) {
    try {
      if (code) {
        const { data: byCode, error: e1 } = await supabase
          .from('courses')
          .select('id')
          .ilike('code', code)
          .maybeSingle();
        if (e1) throw e1;
        if (byCode) return { success: true, exists: true, reason: 'code' };
      }

      if (name && department) {
        const { data: byTuple, error: e2 } = await supabase
          .from('courses')
          .select('id')
          .eq('department', department)
          .ilike('name', name)
          .maybeSingle();
        if (e2) throw e2;
        if (byTuple) return { success: true, exists: true, reason: 'name+department' };
      }

      return { success: true, exists: false };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async logAudit({ action, entity, entity_id, details }) {
    try {
      // Si tienes tabla de auditoría y política, déjalo activo; si no, ignóralo
      await supabase
        .from('audit_logs')
        .insert({ action, entity, entity_id, details });
    } catch {
      // No rompas el flujo por fallar el log
    }
  },

  // ---------- CRUD ----------
  async createCourse({ code, name, department }) {
    await requireSessionOrThrow();
    try {
      const dup = await CourseService.checkDuplicate({ code, name, department });
      if (dup.success && dup.exists) {
        return {
          success: false,
          code: 'DUPLICATE',
          error: dup.reason === 'code'
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
      if (error) throw error;

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

  async updateCourse(id, payload) {
    await requireSessionOrThrow();
    try {
      if (!payload?.name?.trim()) return { success: false, error: 'El nombre es requerido' };
      if (!payload?.code?.trim()) return { success: false, error: 'El código es requerido' };

      const current = await CourseService.getCourseById(id);
      if (!current.success) return current;

      const candidate = {
        code: payload.code ?? current.data.code,
        name: payload.name ?? current.data.name,
        department: payload.department ?? current.data.department,
      };

      const dup = await CourseService.checkDuplicate(candidate);
      if (dup.success && dup.exists) {
        const { data: clashList } = await supabase
          .from('courses')
          .select('id')
          .or(`code.ilike.${candidate.code},and(name.ilike.${candidate.name},department.eq.${candidate.department})`);
        const clash = (clashList || []).find((r) => String(r.id) !== String(id));
        if (clash) {
          return {
            success: false,
            code: 'DUPLICATE',
            error: dup.reason === 'code'
              ? 'Código de materia ya registrado'
              : 'Materia ya registrada para ese departamento',
          };
        }
      }

      // ✅ pedir returning y verificar filas afectadas (RLS puede dejar en 0 sin error)
      const { data, error } = await supabase
        .from('courses')
        .update({
          code: candidate.code,
          name: candidate.name,
          department: candidate.department,
        })
        .eq('id', id)
        .select('id');
      if (error) throw error;
      if (!data || data.length === 0) {
        return { success: false, error: 'No se aplicaron cambios (RLS/filtro).' };
      }

      await CourseService.logAudit({
        action: 'UPDATE',
        entity: 'course',
        entity_id: id,
        details: candidate,
      });

      return { success: true, data: { id } };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async deleteCourseCascade(courseId) {
    await requireSessionOrThrow();
    try {
      const links = await supabase
        .from('professor_courses')
        .delete()
        .eq('course_id', courseId)
        .select('id');
      if (links.error) throw links.error;

      const reviews = await supabase
        .from('reviews')
        .delete()
        .eq('course_id', courseId)
        .select('id');
      if (reviews.error) throw reviews.error;

      const course = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)
        .select('id');
      if (course.error) throw course.error;

      if (!course.data || course.data.length === 0) {
        return { success: false, error: 'No se eliminó el registro (RLS/filtro).' };
      }

      await CourseService.logAudit({
        action: 'DELETE',
        entity: 'course',
        entity_id: courseId,
        details: { cascade: ['professor_courses', 'reviews', 'courses'] },
      });

      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },
};
