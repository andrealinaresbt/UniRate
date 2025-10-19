// apps/mobile/src/hooks/useDebouncedValue.js
import { useEffect, useState } from 'react';

/**
 * Retorna una versión "debounced" del valor.
 * Ideal para esperar a que el usuario termine de tipear antes de consultar.
 */
export default function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
