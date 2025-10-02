import { supabase } from './supabaseClient';

export const ReviewService = {
  // Obtener reseñas de un profesor
  getReviewsByProfessor: async (professorId) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          professors (full_name),
          courses (name, code)
        `)
        .eq('professor_id', professorId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Crear nueva reseña
createReview: async (reviewData) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert([reviewData])
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
},

  // Obtener materias
  getAllCourses: async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

