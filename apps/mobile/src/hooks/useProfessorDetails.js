import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

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

      // 3) Añadir nombre del curso a cada review
      const reviewsWithCourse = await Promise.all(
        (reviewsData || []).map(async (r) => {
          const { data: courseData } = await supabase
            .from('courses')
            .select('name')
            .eq('id', r.course_id)
            .single();

          // Asegurarse de que los tags sean un array
          const tagsArray = Array.isArray(r.professor_tags)
            ? r.professor_tags
            : r.professor_tags
            ? [r.professor_tags]
            : [];

          return {
            ...r,
            course_name: courseData?.name || 'Materia desconocida',
            professor_tags: tagsArray,
          };
        })
      );

      setReviews(reviewsWithCourse);

      // 4) Calcular promedios y porcentaje "volverían a tomar"
      if (reviewsWithCourse.length > 0) {
        const total = reviewsWithCourse.length;
        const sumRating = reviewsWithCourse.reduce((acc, r) => acc + (r.score || 0), 0);
        const sumDifficulty = reviewsWithCourse.reduce((acc, r) => acc + (r.difficulty || 0), 0);
        const takeAgainCount = reviewsWithCourse.reduce(
          (acc, r) => acc + (r.take_again ? 1 : 0),
          0
        );

        setAvgRating((sumRating / total).toFixed(2));
        setAvgDifficulty((sumDifficulty / total).toFixed(2));
        setWouldTakeAgain(Math.round((takeAgainCount / total) * 100));
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
