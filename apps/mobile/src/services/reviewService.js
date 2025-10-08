// apps/mobile/src/services/reviewService.js
import { supabase } from './supabaseClient';
import { CourseProfessorService } from './courseProfessorService';

/**
 * ReviewService:
 * - createReview(reviewData): inserta la reseña (con user_id, score, trimester),
 *   asegura vínculo y recalcula promedios por (professor_id, course_id) de forma tolerante
 * - getAllCourses(): catálogo de materias
 * - getReviewsByProfessor(professorId): lista de reseñas por profesor
 *
 * Export nombrado:
 * - getReviews(filters): listado con filtros y paginación
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

  // Crear nueva reseña (incluye user_id, score y trimester)
  createReview: async (reviewData) => {
    try {
      // 0) Usuario autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('Debes iniciar sesión para publicar una reseña.');

      // 1) Normalizar campos
      const calidad = Number(reviewData?.calidad);
      const dificultad = Number(reviewData?.dificultad);
      const volveria = !!reviewData?.volveria;
      const comentario = reviewData?.comentario ?? null;

      // score: si no viene, usa calidad
      const score = Number.isFinite(reviewData?.score)
        ? Number(reviewData.score)
        : (Number.isFinite(calidad) ? calidad : 0);

      // trimestre actual: YYYY-1..3 (trimestres de 4 meses)
      const now = new Date();
      const term = Math.ceil((now.getMonth() + 1) / 4); // 1..3
      const trimester = `${now.getFullYear()}-${term}`;

      // 2) Payload (incluye claves ES y EN por compatibilidad de esquemas)
      const payload = {
        // claves esperadas por la UI/servicio
        professor_id: reviewData.professor_id,
        course_id: reviewData.course_id,
        asistencia: !!reviewData.asistencia,
        uso_texto: !!reviewData.uso_texto,
        calidad,
        dificultad,
        volveria,
        comentario,
        etiquetas: Array.isArray(reviewData?.etiquetas) ? reviewData.etiquetas : [],

        // claves en inglés que algunos esquemas usan
        user_id: user.id,
        comment: comentario,
        difficulty: Number.isFinite(dificultad) ? dificultad : null,
        would_take_again: volveria,
        score,
        trimester,

        // defaults defensivos si existen esas columnas
        helpful_count: 0,
        not_helpful_count: 0,
        is_anonymous: false,
      };

      // 3) Insert
      const { data: inserted, error } = await supabase
        .from('reviews')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;

      const { professor_id, course_id } = payload;

      // 4) Asegurar vínculo en professor_courses (no rompe si ya existe)
      try {
        await CourseProfessorService.link({ professor_id, course_id });
      } catch (_) {}

      // 5) Recalcular promedios para la combinación profesor+materia
      const { data: revs, error: e2 } = await supabase
        .from('reviews')
        .select('calidad, dificultad, volveria')
        .eq('professor_id', professor_id)
        .eq('course_id', course_id);
      if (e2) throw e2;

      const n = revs?.length || 0;
      const sum = (arr, k) => arr.reduce((acc, x) => acc + (Number(x[k]) || 0), 0);
      const avg = (s) => (n ? (s / n) : null);

      const avg_rating_num = avg(sum(revs, 'calidad'));
      const avg_difficulty_num = avg(sum(revs, 'dificultad'));
      const would_take_again_rate_num = n
        ? (revs.filter(r => !!r.volveria).length / n)
        : null;

      // 6) Actualizar fila de professor_courses (si existe), de forma TOLERANTE
      try {
        const { data: cpRow } = await supabase
          .from('professor_courses')
          .select('id')
          .eq('professor_id', professor_id)
          .eq('course_id', course_id)
          .maybeSingle();

        if (cpRow?.id) {
          // intento 1: nombres tipo avg_rating / would_take_again_rate
          const upd1 = await supabase
            .from('professor_courses')
            .update({
              avg_rating: avg_rating_num,
              avg_difficulty: avg_difficulty_num,
              would_take_again_rate: would_take_again_rate_num,
              reviews_count: n,
            })
            .eq('id', cpRow.id);

          if (upd1.error) {
            // intento 2: nombres alternos (avg_score / would_take_again_percentage)
            await supabase
              .from('professor_courses')
              .update({
                avg_score: avg_rating_num,
                avg_difficulty: avg_difficulty_num,
                would_take_again_percentage: would_take_again_rate_num,
                reviews_count: n,
              })
              .eq('id', cpRow.id);
          }
        }
      } catch (_) {
        // ignorar faltante de columnas en professor_courses
      }

      // 7) (Best-effort) Actualizar agregados de PROFESSORS (intenta dos esquemas)
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

          // intento 1: columnas tipo avg_rating / would_take_again_rate
          const up1 = await supabase.from('professors').update({
            avg_rating: avgP, avg_difficulty: difP, would_take_again_rate: wtaP,
          }).eq('id', professor_id);

          if (up1.error) {
            // intento 2: columnas tipo avg_score / would_take_again_percentage
            await supabase.from('professors').update({
              avg_score: avgP, avg_difficulty: difP, would_take_again_percentage: wtaP,
            }).eq('id', professor_id);
          }
        }
      } catch (_) {}

      // 8) (Best-effort) Actualizar agregados de COURSES (intenta dos esquemas)
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

          const upC1 = await supabase.from('courses').update({
            avg_rating: avgC, avg_difficulty: difC, would_take_again_rate: wtaC,
          }).eq('id', course_id);

          if (upC1.error) {
            await supabase.from('courses').update({
              avg_score: avgC, avg_difficulty: difC, would_take_again_percentage: wtaC,
            }).eq('id', course_id);
          }
        }
      } catch (_) {}

      return { success: true, data: inserted };
    } catch (error) {
      return { success: false, error: error.message || String(error) };
    }
  },

  // Catálogo de materias
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

// ---- Listado con filtros y paginación (export nombrado) ----
// filters = {
//   professor_id?, course_id?,
//   min_rating?, min_difficulty?,
//   orderBy?: 'created_at'|'calidad'|'dificultad', order?: 'desc'|'asc',
//   limit?, offset?
// }
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
