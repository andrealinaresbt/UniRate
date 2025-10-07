import { supabase } from './supabaseClient';
import { CourseProfessorService } from './courseProfessorService';

/**
 * ReviewService:
 * - createReview(reviewData): inserta y recalcula promedios por (professor_id, course_id)
 * - getAllCourses(): catálogo de materias
 * - getReviewsByProfessor(professorId): lista de reseñas por profesor
 */
export const ReviewService = {
  // Obtener reseñas de un profesor
  getReviewsByProfessor: async (professorId) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          professors (full_name),
          courses (name, code)
        `)
        .eq('professor_id', professorId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Crear nueva reseña
  createReview: async (reviewData) => {
    try {
      // 1) Insertar reseña
      const { data: inserted, error } = await supabase
        .from('reviews')
        .insert([reviewData])
        .select()
        .single();
      if (error) throw error;

      const { professor_id, course_id } = reviewData;

      // 2) Asegurar vínculo en professor_courses
      await CourseProfessorService.link({ professor_id, course_id });

      // 3) Recalcular promedios profesor+materia
      const { data: revs, error: e2 } = await supabase
        .from('reviews')
        .select('calidad, dificultad, volveria')
        .eq('professor_id', professor_id)
        .eq('course_id', course_id);
      if (e2) throw e2;

      const n = revs?.length || 0;
      const sum = (arr, k) => arr.reduce((acc, x) => acc + (Number(x[k]) || 0), 0);
      const avg = (s) => (n ? (s / n) : null);

      const avg_rating = avg(sum(revs, 'calidad'));
      const avg_difficulty = avg(sum(revs, 'dificultad'));
      const would_take_again_rate = n
        ? (revs.filter(r => !!r.volveria).length / n)
        : null;

      // 4) Actualizar fila de professor_courses (si existe)
      const { data: cpRow, error: e3 } = await supabase
        .from('professor_courses')
        .select('id')
        .eq('professor_id', professor_id)
        .eq('course_id', course_id)
        .maybeSingle();
      if (e3) throw e3;

      if (cpRow?.id) {
        const { error: e4 } = await supabase
          .from('professor_courses')
          .update({
            avg_rating,
            avg_difficulty,
            would_take_again_rate,
            reviews_count: n
          })
          .eq('id', cpRow.id);
        if (e4) throw e4;
      }

      // (Opcional) promedios globales en perfiles
      try {
        const { data: profRevs } = await supabase
          .from('reviews')
          .select('calidad, dificultad, volveria')
          .eq('professor_id', professor_id);
        if (profRevs) {
          const nP = profRevs.length || 0;
          const avgP = nP ? (sum(profRevs, 'calidad') / nP) : null;
          const difP = nP ? (sum(profRevs, 'dificultad') / nP) : null;
          const wtaP = nP ? (profRevs.filter(r => !!r.volveria).length / nP) : null;
          await supabase.from('professors').update({
            avg_rating: avgP, avg_difficulty: difP, would_take_again_rate: wtaP
          }).eq('id', professor_id);
        }
      } catch (_) {}

      try {
        const { data: courseRevs } = await supabase
          .from('reviews')
          .select('calidad, dificultad, volveria')
          .eq('course_id', course_id);
        if (courseRevs) {
          const nC = courseRevs.length || 0;
          const avgC = nC ? (sum(courseRevs, 'calidad') / nC) : null;
          const difC = nC ? (sum(courseRevs, 'dificultad') / nC) : null;
          const wtaC = nC ? (courseRevs.filter(r => !!r.volveria).length / nC) : null;
          await supabase.from('courses').update({
            avg_rating: avgC, avg_difficulty: difC, would_take_again_rate: wtaC
          }).eq('id', course_id);
        }
      } catch (_) {}

      return { success: true, data: inserted };
    } catch (error) {
      return { success: false, error: error.message || String(error) };
    }
  },

  // Catálogo materias
  getAllCourses: async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('name');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

export async function getReviews(filters = {}) {
  const {
    professor_id,
    course_id,
    min_rating,
    min_difficulty,
    orderBy = 'created_at',
    order = 'desc',
    limit = 20,
    offset = 0,
  } = filters;

  let query = supabase
    .from('reviews')
    .select(`
      *,
      professors ( id, full_name ),
      courses ( id, name, code )
    `, { count: 'exact' })
    .order(orderBy, { ascending: order === 'asc' })
    .range(offset, offset + limit - 1);

  if (professor_id) query = query.eq('professor_id', professor_id);
  if (course_id) query = query.eq('course_id', course_id);
  if (typeof min_rating === 'number') query = query.gte('calidad', min_rating);
  if (typeof min_difficulty === 'number') query = query.gte('dificultad', min_difficulty);

  const { data, error, count } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true, data: data || [], total: count ?? 0 };
}
