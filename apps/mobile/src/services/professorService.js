import { supabase } from './supabaseClient';

export const ProfessorService = {
  // Obtener todos los profesores
  getAllProfessors: async () => {
    try {
      const { data, error } = await supabase
        .from('professors')
        .select('*')
        .order('full_name');
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Buscar profesores por nombre
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

  // Obtener profesor por ID
  getProfessorById: async (professorId) => {
    try {
      const { data, error } = await supabase
        .from('professors')
        .select('*')
        .eq('id', professorId)
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};