// apps/mobile/src/services/courseProfessorService.js
import { supabase } from './supabaseClient';

export const CourseProfessorService = {
  // Crear vínculo (evita duplicados)
  async link({ professor_id, course_id }) {
    try {
      const { data: exists, error: e1 } = await supabase
        .from('professor_courses')
        .select('id')
        .eq('professor_id', professor_id)
        .eq('course_id', course_id)
        .maybeSingle();
      if (e1) throw e1;
      if (exists) return { success: false, code: 'DUPLICATE', error: 'Vínculo ya existe' };

      const { data, error } = await supabase
        .from('professor_courses')
        .insert({ professor_id, course_id })
        .select('id')
        .single();
      if (error) throw error;

      return { success: true, data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // Eliminar vínculo
  async unlink({ professor_id, course_id }) {
    try {
      const { error } = await supabase
        .from('professor_courses')
        .delete()
        .eq('professor_id', professor_id)
        .eq('course_id', course_id);
      if (error) throw error;
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // Cursos por profesor (array de cursos planos)
  async getCoursesByProfessor(professor_id) {
    try {
      const { data, error } = await supabase
        .from('professor_courses')
        .select('course:course_id ( id, code, name, department )')
        .eq('professor_id', professor_id);
      if (error) throw error;
      const courses = (data || []).map(r => r.course).filter(Boolean);
      return { success: true, data: courses };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // Profesores por curso (array de profesores planos)
  async getProfessorsByCourse(course_id) {
    try {
      const { data, error } = await supabase
        .from('professor_courses')
        .select('professor:professor_id ( id, full_name, university, department )')
        .eq('course_id', course_id);
      if (error) throw error;
      const profs = (data || []).map(r => r.professor).filter(Boolean);
      return { success: true, data: profs };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // 🔎 Buscar VÍNCULOS por texto (profesor o materia) SIN usar .or en columnas anidadas
  // Devuelve [{ id, professor:{...}, course:{...} }]
  async searchLinks(term) {
    try {
      const q = (term ?? '').trim();
      if (!q) return { success: true, data: [] };

      // 1) IDs de cursos que matchean por nombre o código
      const { data: courseMatches, error: e1 } = await supabase
        .from('courses')
        .select('id')
        .or(`name.ilike.%${q}%,code.ilike.%${q}%`)
        .limit(100);
      if (e1) throw e1;
      const courseIds = (courseMatches || []).map(r => r.id);

      // 2) IDs de profesores que matchean por nombre
      const { data: profMatches, error: e2 } = await supabase
        .from('professors')
        .select('id')
        .ilike('full_name', `%${q}%`)
        .limit(100);
      if (e2) throw e2;
      const profIds = (profMatches || []).map(r => r.id);

      // Si no hay ningún match, devolvemos vacío
      if (courseIds.length === 0 && profIds.length === 0) {
        return { success: true, data: [] };
      }

      // 3) Buscar vínculos por IN (evita .or con anidados)
      const orParts = [];
      if (courseIds.length) orParts.push(`course_id.in.(${courseIds.join(',')})`);
      if (profIds.length)  orParts.push(`professor_id.in.(${profIds.join(',')})`);

      const { data, error } = await supabase
        .from('professor_courses')
        .select(`
          id,
          professor:professor_id ( id, full_name, university, department ),
          course:course_id ( id, code, name, department )
        `)
        .or(orParts.join(','))
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },
};
