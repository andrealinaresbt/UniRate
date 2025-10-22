// apps/mobile/src/services/reviewService.js
import { supabase } from './supabaseClient';
import { CourseProfessorService } from './courseProfessorService'; // opcional: si no existe, el fallback interno se encarga

/**
 * ===============================
 *  HELPERS M2M: PROFESOR ↔ CURSO
 * ===============================
 */

/** Crea (si no existe) el vínculo profesor-curso en la pivote. */
async function linkProfessorCourseFallback({ professor_id, course_id }) {
  if (!professor_id || !course_id) return;

  // ¿ya existe?
  let existing = null;
  try {
    const { data, error } = await supabase
      .from('professor_courses')
      .select('id')
      .eq('professor_id', professor_id)
      .eq('course_id', course_id)
      .limit(1);

    if (error) throw error;
    existing = data?.[0] || null;
  } catch (_) {
    // ignoramos, seguiremos intentando insert
  }

  if (existing?.id) return; // ya está

  // insertar de forma tolerante (manejar duplicado si hay índice único)
  const { error: insertErr } = await supabase
    .from('professor_courses')
    .insert([{ professor_id, course_id }]);

  // si hay error por duplicado / constraint, lo ignoramos
  if (insertErr && !String(insertErr.message).toLowerCase().includes('duplicate')) {
    // otros errores reales: los ignoramos para no romper el flujo
  }
}

/** Enlaza profesor-curso usando servicio externo si existe; si no, fallback local. */
async function ensureLinkProfessorCourse({ professor_id, course_id }) {
  try {
    if (CourseProfessorService?.link) {
      await CourseProfessorService.link({ professor_id, course_id });
      return;
    }
  } catch (_) {
    // si el import existe pero falla, usamos fallback
  }
  await linkProfessorCourseFallback({ professor_id, course_id });
}

/**
 * Devuelve SOLO las materias que dicta un profesor.
 * @param {string|number} professorId
 * @returns {Promise<Array<{id:string|number, name:string, code?:string}>>}
 */
export async function getCoursesByProfessor(professorId) {
  if (!professorId) return [];

  // 1) IDs desde la pivote
  const { data: links, error: linksErr } = await supabase
    .from('professor_courses')
    .select('course_id')
    .eq('professor_id', professorId);

  if (linksErr) throw linksErr;

  const ids = [...new Set((links || []).map(l => l.course_id))];
  if (ids.length === 0) return [];

  // 2) Cursos por IDs
  const { data: courses, error: coursesErr } = await supabase
    .from('courses')
    .select('id, name, code')
    .in('id', ids)
    .order('name', { ascending: true });

  if (coursesErr) throw coursesErr;
  return courses || [];
}

/**
 * Devuelve SOLO los profesores que dictan una materia.
 * @param {string|number} courseId
 * @returns {Promise<Array<{id:string|number, name?:string, full_name?:string}>>}
 */
export async function getProfessorsByCourse(courseId) {
  if (!courseId) return [];

  const { data: links, error: linksErr } = await supabase
    .from('professor_courses')
    .select('professor_id')
    .eq('course_id', courseId);

  if (linksErr) throw linksErr;

  const ids = [...new Set((links || []).map(l => l.professor_id))];
  if (ids.length === 0) return [];

  // Nota: algunos esquemas usan "name", otros "full_name"
  const { data: professors, error: profErr } = await supabase
    .from('professors')
    .select('id, name, full_name')
    .in('id', ids)
    .order('name', { ascending: true });

  if (profErr) throw profErr;
  return (professors || []).map(p => ({
    id: p.id,
    // preferimos full_name si existe, si no name
    name: p.full_name || p.name || '',
    full_name: p.full_name,
  }));
}

/**
 * Valida que el par profesor–curso exista en la pivote.
 * @returns {Promise<boolean>}
 */
export async function isValidProfessorCoursePair(professorId, courseId) {
  if (!professorId || !courseId) return false;

  const { data, error } = await supabase
    .from('professor_courses')
    .select('id')
    .eq('professor_id', professorId)
    .eq('course_id', courseId)
    .limit(1);

  if (error) throw error;
  return (data || []).length > 0;
}

/** Catálogo completo de profesores (para estado inicial). */
export async function getAllProfessors() {
  const { data, error } = await supabase
    .from('professors')
    .select('id, name, full_name')
    .order('name', { ascending: true });

  if (error) throw error;

  return (data || []).map(p => ({
    id: p.id,
    name: p.full_name || p.name || '',
    full_name: p.full_name,
  }));
}

/** Catálogo completo de materias (para estado inicial). */
export async function getAllCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('id, name, code')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * ============================
 *  SERVICIO DE RESEÑAS (CRUD)
 * ============================
 */
export const ReviewService = {
  // Obtener reseñas de un profesor
  getReviewsByProfessor: async (professorId) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          professors ( id, full_name, name ),
          courses ( id, name, code )
        `)
        .eq('professor_id', professorId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Asegurar nombre consistente del profe
      const fixed = (data || []).map(r => ({
        ...r,
        professors: r.professors
          ? { ...r.professors, display_name: r.professors.full_name || r.professors.name || '' }
          : null,
      }));

      return { success: true, data: fixed };
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

      // 2) Payload (claves redundantes ES/EN por compatibilidad)
      const professor_id = reviewData.professor_id;
      const course_id = reviewData.course_id;

      // Validar combinación profesor-curso antes de insertar
      const validPair = await isValidProfessorCoursePair(professor_id, course_id);
      if (!validPair) {
        throw new Error('La combinación profesor–materia no es válida.');
      }

      const payload = {
        professor_id,
        course_id,
        asistencia: !!reviewData.asistencia,
        uso_texto: !!reviewData.uso_texto,
        calidad,
        dificultad,
        volveria,
        comentario,
        etiquetas: Array.isArray(reviewData?.etiquetas) ? reviewData.etiquetas : [],

        user_id: user.id,
        comment: comentario,
        difficulty: Number.isFinite(dificultad) ? dificultad : null,
        would_take_again: volveria,
        score,
        trimester,

        helpful_count: 0,
        not_helpful_count: 0,
        is_anonymous: !!reviewData?.is_anonymous,
      };

      // 3) Insert
      const { data: inserted, error } = await supabase
        .from('reviews')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;

      // 4) Asegurar vínculo en professor_courses (no rompe si ya existe)
      await ensureLinkProfessorCourse({ professor_id, course_id });

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
        // buscar id de la pivote
        const { data: rows, error: eFind } = await supabase
          .from('professor_courses')
          .select('id')
          .eq('professor_id', professor_id)
          .eq('course_id', course_id)
          .limit(1);

        if (!eFind && rows?.[0]?.id) {
          const pid = rows[0].id;

          // intento 1: nombres tipo avg_rating / would_take_again_rate
          const upd1 = await supabase
            .from('professor_courses')
            .update({
              avg_rating: avg_rating_num,
              avg_difficulty: avg_difficulty_num,
              would_take_again_rate: would_take_again_rate_num,
              reviews_count: n,
            })
            .eq('id', pid);

          if (upd1.error) {
            // intento 2: nombres alternos
            await supabase
              .from('professor_courses')
              .update({
                avg_score: avg_rating_num,
                avg_difficulty: avg_difficulty_num,
                would_take_again_percentage: would_take_again_rate_num,
                reviews_count: n,
              })
              .eq('id', pid);
          }
        }
      } catch (_) {
        // ignorar faltante de columnas en professor_courses
      }

      // 7) (Best-effort) Agregados de PROFESSORS
      try {
        const { data: profRevs } = await supabase
          .from('reviews')
          .select('calidad, dificultad, volveria')
          .eq('professor_id', professor_id);

        if (profRevs) {
          const nP = profRevs.length || 0;
          const avgP = nP ? (profRevs.reduce((a, r) => a + (Number(r.calidad) || 0), 0) / nP) : null;
          const difP = nP ? (profRevs.reduce((a, r) => a + (Number(r.dificultad) || 0), 0) / nP) : null;
          const wtaP = nP ? (profRevs.filter(r => !!r.volveria).length / nP) : null;

          const up1 = await supabase.from('professors').update({
            avg_rating: avgP, avg_difficulty: difP, would_take_again_rate: wtaP,
          }).eq('id', professor_id);

          if (up1.error) {
            await supabase.from('professors').update({
              avg_score: avgP, avg_difficulty: difP, would_take_again_percentage: wtaP,
            }).eq('id', professor_id);
          }
        }
      } catch (_) {}

      // 8) (Best-effort) Agregados de COURSES
      try {
        const { data: courseRevs } = await supabase
          .from('reviews')
          .select('calidad, dificultad, volveria')
          .eq('course_id', course_id);

        if (courseRevs) {
          const nC = courseRevs.length || 0;
          const avgC = nC ? (courseRevs.reduce((a, r) => a + (Number(r.calidad) || 0), 0) / nC) : null;
          const difC = nC ? (courseRevs.reduce((a, r) => a + (Number(r.dificultad) || 0), 0) / nC) : null;
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
      const data = await getAllCourses();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * =======================================
 *  LISTADO / DETALLE / UPDATE / DELETE
 * =======================================
 */

// Listado con filtros y paginación
// filters = {
//   professor_id?, user_id?, course_id?,
//   min_rating?, min_difficulty?,
//   orderBy?: 'created_at'|'calidad'|'dificultad', order?: 'desc'|'asc',
//   limit?, offset?
// }
export async function getReviews(filters = {}) {
  const {
    professor_id,
    user_id,
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
      professors ( id, full_name, name ),
      courses ( id, name, code )
    `, { count: 'exact' });

  // filtros
  if (professor_id) query = query.eq('professor_id', professor_id);
  if (user_id) query = query.eq('user_id', user_id);
  if (course_id) query = query.eq('course_id', course_id);
  if (typeof min_rating === 'number') query = query.gte('calidad', min_rating);
  if (typeof min_difficulty === 'number') query = query.gte('dificultad', min_difficulty);

  // orden + paginación
  query = query.order(orderBy, { ascending: order === 'asc' }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) return { success: false, error: error.message };

  // normaliza display_name del profe
  const fixed = (data || []).map(r => ({
    ...r,
    professors: r.professors
      ? { ...r.professors, display_name: r.professors.full_name || r.professors.name || '' }
      : null,
  }));

  return { success: true, data: fixed, total: count ?? 0 };
}

// Obtener una reseña por ID (y el usuario en consulta aparte)
export async function getReviewById(id) {
  const { data: review, error } = await supabase
    .from('reviews')
    .select(`
      id, created_at, score, difficulty, would_take_again, comment, trimester,
      professor_id, course_id, user_id,
      professors ( id, full_name, name ),
      courses ( id, name, code )
    `)
    .eq('id', id)
    .single();

  if (error) return { success: false, error: error.message };
  if (!review) return { success: false, error: 'No existe la reseña' };

  // usuario en consulta aparte (tu tabla es "users")
  let user = null;
  if (review.user_id) {
    const { data: u, error: e2 } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('id', review.user_id)
      .single();
    if (!e2) user = u;
  }

  const prof = review.professors
    ? { ...review.professors, display_name: review.professors.full_name || review.professors.name || '' }
    : null;

  return { success: true, data: { ...review, professors: prof, user } };
}

// Actualizar una reseña por ID
export async function updateReview(id, payload = {}) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message || String(e) };
  }
}

// Eliminar una reseña por ID
export async function deleteReview(id) {
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message || String(e) };
  }
}
