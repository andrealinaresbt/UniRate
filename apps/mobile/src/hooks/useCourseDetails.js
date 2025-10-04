import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

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
          score,
          difficulty,
          comment,
          professor_tags,
          created_at
        `)
        .eq('course_id', courseId);
      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);

      // 3) Calcular promedios generales
      if (reviewsData && reviewsData.length > 0) {
        const total = reviewsData.length;
        const sumScore = reviewsData.reduce((acc, r) => acc + (r.score || 0), 0);
        const sumDifficulty = reviewsData.reduce((acc, r) => acc + (r.difficulty || 0), 0);

        setAvgSatisfaccion((sumScore / total).toFixed(2));
        setAvgDificultad((sumDifficulty / total).toFixed(2));

        // 4) Agrupar profesores
        const mapProf = {};
        reviewsData.forEach((r) => {
          const profId = r.professor_id || 'desconocido';
          if (!mapProf[profId]) {
            mapProf[profId] = { professor_id: r.professor_id, reviewsSum: 0, reviewsCount: 0 };
          }
          mapProf[profId].reviewsSum += r.score || 0;
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
