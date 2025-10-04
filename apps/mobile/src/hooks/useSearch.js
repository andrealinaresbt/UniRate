import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export function useSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!searchTerm) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(() => {
      fetchResults(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchResults = async (term) => {
    setLoading(true);
    setError(null);

    try {
      // Fetch professors
      const { data: profs, error: profError } = await supabase
        .from('professors')
        .select('*, reviews(score_teacher, professor_id)') // Traer también score_teacher y professor_id
        .ilike('full_name', `%${term}%`);

      if (profError) throw profError;

      // Para cada profesor, consulta reviews filtrando por su id
      const professorsFormatted = await Promise.all(
        (profs || []).map(async (p) => {
          const { data: profReviews, error: profReviewsError } = await supabase
            .from('reviews')
            .select('score_teacher')
            .eq('professor_id', p.id);
          const review_count = profReviews?.length || 0;
          const avg_score =
            review_count > 0
              ? (profReviews.reduce((sum, r) => sum + (r.score_teacher || 0), 0) / review_count).toFixed(2)
              : null;
          return {
            ...p,
            type: 'professor',
            review_count,
            avg_score,
          };
        })
      );

      // Fetch courses
      const { data: courses, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .ilike('name', `%${term}%`);

      if (courseError) throw courseError;

      // Add avg_score to courses
      const coursesWithAvg = await Promise.all(
        (courses || []).map(async (c) => {
          const { data: reviews } = await supabase
            .from('reviews')
            .select('score')
            .eq('course_id', c.id);

          const total = reviews?.length || 0;
          const avg_score =
            total > 0
              ? (reviews.reduce((sum, r) => sum + (r.score || 0), 0) / total).toFixed(2)
              : null;

          return { ...c, type: 'course', avg_score, review_count: total };
        })
      );

      setResults([...professorsFormatted, ...coursesWithAvg]);
      setShowResults(true);
    } catch (err) {
      console.log(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const retrySearch = () => fetchResults(searchTerm);
  const clearSearch = () => setSearchTerm('');

  return {
    searchTerm,
    setSearchTerm,
    results,
    loading,
    showResults,
    error,
    retrySearch,
    clearSearch,
  };
}
