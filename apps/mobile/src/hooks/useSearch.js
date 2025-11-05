import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { countReportsFor } from '../services/reportService';
import { REPORT_THRESHOLD } from '../services/reviewService';

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
        // traer reviews con ambos campos por seguridad: score (course-level) y score_teacher
        // incluir id para poder filtrar por reports
        .select('*, reviews(id, score, score_teacher, professor_id)')
        .ilike('full_name', `%${term}%`);

      if (profError) throw profError;

      // Para cada profesor, consulta reviews filtrando por su id
      const professorsFormatted = await Promise.all(
        (profs || []).map(async (p) => {
          // profs may already include nested reviews from the initial select
          let profReviews = p.reviews || [];
          // ensure we have ids to count reports
          if (!profReviews.length) {
            const { data: fetched } = await supabase
              .from('reviews')
              .select('id, score, score_teacher')
              .eq('professor_id', p.id);
            profReviews = fetched || [];
          }

          // filter out hidden reviews using report counts
          const ids = profReviews.map(r => r.id).filter(Boolean);
          const counts = await countReportsFor(ids);
          const visible = (profReviews || []).filter(r => (counts[r.id] || 0) < REPORT_THRESHOLD);

          const review_count = visible.length || 0;
          const avg_score =
            review_count > 0
              ? (
                  visible.reduce((sum, r) => {
                    const val = Number(r.score ?? r.score_teacher ?? 0);
                    return sum + (isNaN(val) ? 0 : val);
                  }, 0) / review_count
                ).toFixed(2)
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
            .select('id, score')
            .eq('course_id', c.id);

          const ids = (reviews || []).map(r => r.id).filter(Boolean);
          const counts = await countReportsFor(ids);
          const visible = (reviews || []).filter(r => (counts[r.id] || 0) < REPORT_THRESHOLD);

          const total = visible.length || 0;
          const avg_score =
            total > 0
              ? (visible.reduce((sum, r) => sum + (Number(r.score || 0)), 0) / total).toFixed(2)
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
