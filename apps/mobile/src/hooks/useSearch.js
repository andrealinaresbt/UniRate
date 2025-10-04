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
        .select('*, reviews(id)') // Traer también las reseñas
        .ilike('full_name', `%${term}%`);

      if (profError) throw profError;

      const professorsFormatted = (profs || []).map((p) => ({
        ...p,
        type: 'professor',
        review_count: p.reviews ? p.reviews.length : 0,
        avg_score:
          p.reviews && p.reviews.length > 0
            ? (p.reviews.reduce((sum, r) => sum + (r.score || 0), 0) / p.reviews.length).toFixed(2)
            : null,
      }));

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
