import { supabase } from './supabaseClient';

export const SearchService = {
  // Búsqueda unificada de profesores Y materias
  unifiedSearch: async (searchTerm) => {
    try {
      
      const [professorsResult, coursesResult] = await Promise.all([
        // Búsqueda de profesores
        supabase
          .from('professors')
          .select('*')
          .ilike('full_name', `%${searchTerm}%`)
          .order('full_name'),
        
        // Búsqueda de materias (por nombre O código)
        supabase
          .from('courses')
          .select('*')
          .or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`)
          .order('name')
      ]);

      const errors = [professorsResult.error, coursesResult.error].filter(Boolean);
      if (errors.length > 0) {
        throw new Error(errors.map(e => e.message).join(', '));
      }

      // Combinar y normalizar resultados
      const results = [
        ...(professorsResult.data || []).map(item => ({
          ...item,
          type: 'professor',
          displayName: item.full_name,
          subtitle: item.department
        })),
        ...(coursesResult.data || []).map(item => ({
          ...item,
          type: 'course', 
          displayName: item.name,
          subtitle: `Código: ${item.code}`
        }))
      ];

      return { 
        success: true, 
        data: results,
        stats: {
          professors: professorsResult.data?.length || 0,
          courses: coursesResult.data?.length || 0,
          total: results.length
        }
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Búsquedas individuales (para casos específicos)
  searchProfessors: async (searchTerm) => {
    try {
      const { data, error } = await supabase
        .from('professors')
        .select('*')
        .ilike('full_name', `%${searchTerm}%`)
        .order('full_name');
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  searchCourses: async (searchTerm) => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`)
        .order('name');
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Búsqueda por tipo específico
  searchByType: async (searchTerm, type) => {
    if (type === 'professor') {
      return SearchService.searchProfessors(searchTerm);
    } else if (type === 'course') {
      return SearchService.searchCourses(searchTerm);
    } else {
      return SearchService.unifiedSearch(searchTerm);
    }
  }
};