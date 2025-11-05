import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { countReportsFor } from '../services/reportService';
import { REPORT_THRESHOLD } from '../services/reviewService';

const DEBUG_COURSE_HOOK = false;

export function useCourseDetails(courseId) {
  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [professorsAggregated, setProfessorsAggregated] = useState([]);
  const [avgSatisfaccion, setAvgSatisfaccion] = useState(null);
  const [avgDificultad, setAvgDificultad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!courseId) return;
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1) Obtener el curso
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      if (courseError) throw courseError;
      setCourse(courseData);

      // 2) Obtener reseñas
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          course_id,
          professor_id,
          score_teacher,
          score,
          difficulty,
          comment,
      
          professor_tags,
          comentario,
          calidad,
          dificultad,
          created_at
        `)
        .eq('course_id', courseId);
      if (reviewsError) throw reviewsError;
      // Normalize each review to consistent fields
      const normalized = (reviewsData || []).map((r) => ({
        ...r,
        score: Number(r.score ?? r.calidad ?? r.score_teacher ?? 0),
        score_teacher: Number(r.score_teacher ?? r.score ?? r.calidad ?? 0),
        difficulty: Number(r.difficulty ?? r.dificultad ?? 0),
        comment: r.comment ?? r.comentario ?? r.comment ?? '',
      }));
      // Count reports and filter out reviews that exceed the threshold
      let used = normalized;
      try {
        const ids = normalized.map(r => r.id).filter(Boolean);
        const counts = await countReportsFor(ids);
        const filtered = normalized.filter(r => {
          const c = counts[r.id] || 0;
          r.reports_count = c;
          return c < REPORT_THRESHOLD;
        });
        used = filtered;
        setReviews(filtered || []);
      } catch (e) {
        console.error('Error counting reports in useCourseDetails', e);
        setReviews(normalized || []);
      }

      // 3) Calcular promedios generales
  if (used && used.length > 0) {
    const total = used.length;
  const sumScore = used.reduce((acc, r) => acc + (Number(r.score) || 0), 0); // score para materia
  const sumDifficulty = used.reduce((acc, r) => acc + (Number(r.difficulty) || 0), 0);

    setAvgSatisfaccion((sumScore / total).toFixed(2));
  const avgDiffVal = (sumDifficulty / total);
  setAvgDificultad(avgDiffVal.toFixed(2));
  if (DEBUG_COURSE_HOOK && avgDiffVal === 0) console.log('[useCourseDetails] courseId', courseId, 'normalized', used);

    // 4) Agrupar profesores
    const mapProf = {};
    used.forEach((r) => {
          const profId = r.professor_id || 'desconocido';
          if (!mapProf[profId]) {
            mapProf[profId] = { professor_id: r.professor_id, reviewsSum: 0, reviewsCount: 0 };
          }
    // Use course-level score to compute professor aggregates (align with requested rule)
    mapProf[profId].reviewsSum += Number(r.score) || 0;
          mapProf[profId].reviewsCount += 1;
        });

        const aggregated = await Promise.all(
          Object.values(mapProf).map(async (p) => {
            if (!p.professor_id) {
              return {
                professor_id: null,
                nombre: 'Profesor desconocido',
                avgRating: (p.reviewsSum / p.reviewsCount).toFixed(2),
                reviewsCount: p.reviewsCount
              };
            }
            const { data: profData } = await supabase
              .from('professors')
              .select('full_name')
              .eq('id', p.professor_id)
              .single();
            return {
              professor_id: p.professor_id,
              nombre: profData?.full_name || 'Profesor desconocido',
              avgRating: (p.reviewsSum / p.reviewsCount).toFixed(2),
              reviewsCount: p.reviewsCount
            };
          })
        );
        setProfessorsAggregated(aggregated);
      } else {
        setAvgSatisfaccion(null);
        setAvgDificultad(null);
        setProfessorsAggregated([]);
      }

    } catch (err) {
      console.log(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => fetchData();

  return {
    course,
    reviews,
    professorsAggregated,
    avgSatisfaccion,
    avgDificultad,
    loading,
    error,
    refetch
  };
}
