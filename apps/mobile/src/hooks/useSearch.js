import { useState, useEffect, useRef } from 'react';
import { SearchService } from '../services/SearchService';

export const useSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchTerm.trim()) {
      setShowResults(false);
      setResults([]);
      return;
    }

    setLoading(true);
    setShowResults(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await SearchService.unifiedSearch(searchTerm);
        setResults(result.success ? result.data : []);
      } catch (error) {
        console.error('Error en búsqueda:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const clearSearch = () => {
    setSearchTerm('');
    setShowResults(false);
    setResults([]);
  };

  return {
    searchTerm,
    setSearchTerm,
    results,
    loading,
    showResults,
    clearSearch
  };
};