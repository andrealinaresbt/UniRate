import { supabase } from './supabaseClient';

export const favoritesService = {
  // Agregar a favoritos
  async addFavorite(userId, type, courseId = null, professorId = null) {
    const { data, error } = await supabase
      .from('favorites')
      .insert([
        { 
          user_id: userId,
          type: type, // 'course' o 'professor'
          course_id: courseId,
          professor_id: professorId
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Eliminar de favoritos
  async removeFavorite(favoriteId) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', favoriteId);

    if (error) throw error;
  },

  // Eliminar por referencia (más seguro)
  async removeFavoriteByReference(userId, type, courseId = null, professorId = null) {
    let query = supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('type', type);

    if (courseId) {
      query = query.eq('course_id', courseId);
    }
    if (professorId) {
      query = query.eq('professor_id', professorId);
    }

    const { error } = await query;
    if (error) throw error;
  },

  // Verificar si es favorito
  async isFavorite(userId, type, courseId = null, professorId = null) {
    let query = supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('type', type);

    if (courseId) {
      query = query.eq('course_id', courseId);
    }
    if (professorId) {
      query = query.eq('professor_id', professorId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data.length > 0 ? data[0].id : null;
  },

  // Obtener todos los favoritos de un usuario
  async getUserFavorites(userId) {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id,
        type,
        course_id,
        professor_id,
        created_at,
        courses (id, name, code),
        professors (id, full_name, department)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Obtener solo cursos favoritos
  async getUserFavoriteCourses(userId) {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id,
        course_id,
        created_at,
        courses (id, name, code, department)
      `)
      .eq('user_id', userId)
      .eq('type', 'course')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Obtener solo profesores favoritos
  async getUserFavoriteProfessors(userId) {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id,
        professor_id,
        created_at,
        professors (id, full_name, department, avg_score)
      `)
      .eq('user_id', userId)
      .eq('type', 'professor')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};