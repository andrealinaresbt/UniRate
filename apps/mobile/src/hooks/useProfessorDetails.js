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
      // 1️⃣ Datos del profesor
      const { data: profData, error: profError } = await supabase
        .from('professors')
        .select('*')
        .eq('id', professorId)
        .single();
      if (profError) throw profError;
      setProfessor(profData);

      // 2️⃣ Reseñas del profesor
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          course_id,
          professor_id,
          score,
          difficulty,
          would_take_again,
          comment,
          created_at
        `)
        .eq('professor_id', professorId);
      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);

      // 3️⃣ Promedios y porcentaje would_take_again
      if (reviewsData && reviewsData.length > 0) {
        const total = reviewsData.length;
        const sumScore = reviewsData.reduce((acc, r) => acc + (r.score || 0), 0);
        const sumDifficulty = reviewsData.reduce((acc, r) => acc + (r.difficulty || 0), 0);
        const sumWouldTakeAgain = reviewsData.reduce(
          (acc, r) => acc + (r.would_take_again ? 1 : 0),
          0
        );

        setAvgRating((sumScore / total).toFixed(2));
        setAvgDifficulty((sumDifficulty / total).toFixed(2));
        setWouldTakeAgain(((sumWouldTakeAgain / total) * 100).toFixed(0));
      }

     /*  // 4️⃣ Top 3 etiquetas
      const tagCounts = {};
      reviewsData.forEach(r => {
        (r.tags || []).forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([tag]) => tag);
      setTopTags(sortedTags); */

      // 5️⃣ Materias que dicta
      const courseIds = [...new Set(reviewsData.map(r => r.course_id))];
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .in('id', courseIds);
      setCoursesTaught(coursesData || []);

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

    coursesTaught,
    loading,
    error,
    refetch,
  };
}
