import { supabase } from './supabaseClient';

export const CourseService = {
  // Obtener todas las materias
  getAllCourses: async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('name'); // Cambia 'name' si usas otra columna para ordenar
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Buscar materias por nombre
  searchCourses: async (searchTerm) => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .ilike('name', `%${searchTerm}%`) // Ajusta 'name' si tu columna es distinta
        .order('name');
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Obtener materia por ID
  getCourseById: async (courseCode) => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('code', courseCode)
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
