import { useState, useEffect, useRef } from 'react';
import { SearchService } from '../services/SearchService';

export const useSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null); // ← NUEVO: estado de error
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchTerm.trim()) {
      setShowResults(false);
      setResults([]);
      setError(null); // ← Limpiar error al borrar búsqueda
      return;
    }

    setLoading(true);
    setShowResults(true);
    setError(null); // ← Limpiar error antes de nueva búsqueda

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await SearchService.unifiedSearch(searchTerm);
        
        if (result.success) {
          setResults(result.data);
        } else {
          // Si hay error en el servicio, lo mostramos
          setError(result.error || 'Error en la búsqueda');
          setResults([]);
        }
      } catch (error) {
        // Error de red o excepción no manejada
        console.error('Error en búsqueda:', error);
        if (error.message?.includes('Network') || error.message?.includes('fetch')) {
          setError('Error de conexión. Verifica tu internet e intenta nuevamente.');
        } else if (error.message?.includes('JWT') || error.message?.includes('auth')) {
          setError('Error de autenticación. Por favor, reinicia la sesión.');
        } else {
          setError('Error inesperado. Por favor, intenta nuevamente.');
        }
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

  // ← NUEVA FUNCIÓN: Reintentar búsqueda
  const retrySearch = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await SearchService.unifiedSearch(searchTerm);
      
      if (result.success) {
        setResults(result.data);
      } else {
        setError(result.error || 'Error en la búsqueda');
        setResults([]);
      }
    } catch (error) {
      setError('Error de conexión. Verifica tu internet e intenta nuevamente.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowResults(false);
    setResults([]);
    setError(null); // ← Limpiar error también
  };

  return {
    searchTerm,
    setSearchTerm,
    results,
    loading,
    showResults,
    error, // ← Exportar error
    retrySearch, // ← Exportar función de reintento
    clearSearch
  };
};