import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

// Debug flag: set to true to log normalization details
const DEBUG_PROF_HOOK = false;

export function useProfessorDetails(professorId) {
  const [professor, setProfessor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [avgDifficulty, setAvgDifficulty] = useState(null);
  const [wouldTakeAgain, setWouldTakeAgain] = useState(null);
  const [topTags, setTopTags] = useState([]);
  const [coursesTaught, setCoursesTaught] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!professorId) return;
    fetchData();
  }, [professorId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1) Obtener datos del profesor
      const { data: profData, error: profError } = await supabase
        .from('professors')
        .select('*')
        .eq('id', professorId)
        .single();
      if (profError) throw profError;
      setProfessor(profData);

      // 2) Obtener reviews del profesor
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('professor_id', professorId);
      if (reviewsError) throw reviewsError;
      // 3) Normalize reviews and add course name to each review
      const reviewsWithCourse = await Promise.all(
        (reviewsData || []).map(async (r) => {
          const { data: courseData } = await supabase
            .from('courses')
            .select('name')
            .eq('id', r.course_id)
            .single();

          // Normalize numeric fields coming from different schemas
          const normalized = {
            ...r,
            // score variants (course-level / teacher-level)
            score: Number(r.score ?? r.calidad ?? r.score_teacher ?? 0),
            score_teacher: Number(r.score_teacher ?? r.score ?? r.calidad ?? 0),
            // difficulty variants
            difficulty: Number(r.difficulty ?? r.dificultad ?? 0),
            // comment variants
            comment: r.comment ?? r.comentario ?? r.comment ?? '',
          };

          // Ensure tags array
          const tagsArray = Array.isArray(normalized.professor_tags)
            ? normalized.professor_tags
            : normalized.professor_tags
            ? [normalized.professor_tags]
            : [];

          return {
            ...normalized,
            course_name: courseData?.name || 'Materia desconocida',
            professor_tags: tagsArray,
          };
        })
      );

      setReviews(reviewsWithCourse);

      // 4) Calcular promedios y porcentaje "volverían a tomar"
      if (reviewsWithCourse.length > 0) {
        const total = reviewsWithCourse.length;
        // Use normalized fields to compute aggregates
        const sumRating = reviewsWithCourse.reduce((acc, r) => acc + (Number(r.score_teacher) || 0), 0);
        const sumDifficulty = reviewsWithCourse.reduce((acc, r) => acc + (Number(r.difficulty) || 0), 0);
        const takeAgainCount = reviewsWithCourse.reduce(
          (acc, r) => acc + ((r.would_take_again || r.volveria || r.take_again) ? 1 : 0),
          0
        );

        setAvgRating((sumRating / total).toFixed(2));
        const avgDiffVal = (sumDifficulty / total);
        setAvgDifficulty(avgDiffVal.toFixed(2));
        setWouldTakeAgain(Math.round((takeAgainCount / total) * 100));
        if (DEBUG_PROF_HOOK && avgDiffVal === 0) {
          console.log('[useProfessorDetails] professorId', professorId, 'normalized reviews', reviewsWithCourse);
          console.log('[useProfessorDetails] computed avgDifficulty', avgDiffVal);
        }
      } else {
        setAvgRating(null);
        setAvgDifficulty(null);
        setWouldTakeAgain(null);
      }

      // 5) Calcular top 3 tags
      const allTags = [];
      reviewsWithCourse.forEach((r) => {
        r.professor_tags.forEach((tag) => allTags.push(tag));
      });

      const tagCounts = allTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {});

      const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([tag]) => tag);

      setTopTags(sortedTags);

      // 6) Cursos del profesor
      const courseIds = [...new Set(reviewsWithCourse.map((r) => r.course_id))];
      const coursesData = await Promise.all(
        courseIds.map(async (id) => {
          const { data: c } = await supabase
            .from('courses')
            .select('id, name')
            .eq('id', id)
            .single();
          return c;
        })
      );
      setCoursesTaught(coursesData.filter(Boolean));

    } catch (err) {
      console.log(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => fetchData();

  return {
    professor,
    reviews,
    avgRating,
    avgDifficulty,
    wouldTakeAgain,
    topTags,
    coursesTaught,
    loading,
    error,
    refetch,
  };
}
