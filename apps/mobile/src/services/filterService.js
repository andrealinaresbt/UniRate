// services/filterService.js
import { supabase } from './supabaseClient';

export const filterService = {
  async getFilteredReviews(filters = {}, context = {}) {
    let query = supabase
      .from('reviews')
      .select(`
        *,
        course_id,
        professor_id,
        courses (id, name, code),
        professors (id, full_name, department)
      `);

    // Filtro por contexto (profesor o materia)
    if (context.professorId && !filters.professorId) {
      query = query.eq('professor_id', context.professorId);
    }
    if (context.courseId && !filters.courseId) {
      query = query.eq('course_id', context.courseId);
    }

    // Filtros adicionales - SOLO aplicar si no son null/undefined
    if (filters.courseId) {
      query = query.eq('course_id', filters.courseId);
    }

    if (filters.professorId) {
      query = query.eq('professor_id', filters.professorId);
    }

    // Filtros de CALIFICACIÓN (score)
    if (filters.minRating !== null && filters.minRating !== undefined) {
      query = query.gte('score', filters.minRating);
    }

    if (filters.maxRating !== null && filters.maxRating !== undefined) {
      query = query.lte('score', filters.maxRating);
    }

    // Filtros de DIFICULTAD (difficulty) - CORREGIDO
    if (filters.minDifficulty !== null && filters.minDifficulty !== undefined) {
      query = query.gte('difficulty', filters.minDifficulty);
    }

    if (filters.maxDifficulty !== null && filters.maxDifficulty !== undefined) {
      query = query.lte('difficulty', filters.maxDifficulty);
    }
    // Filtro por fecha
    if (filters.startDate) {
    query = query.gte('created_at', `${filters.startDate}T00:00:00+00:00`);
    }

    if (filters.endDate) {
    query = query.lte('created_at', `${filters.endDate}T23:59:59+00:00`);
    }

    // Ordenar
    if (filters.sortBy) {
      if (filters.sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (filters.sortBy === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else if (filters.sortBy === 'highest_rating') {
        query = query.order('score', { ascending: false });
      } else if (filters.sortBy === 'lowest_rating') {
        query = query.order('score', { ascending: true });
      } else if (filters.sortBy === 'highest_difficulty') {
        query = query.order('difficulty', { ascending: false });
      } else if (filters.sortBy === 'lowest_difficulty') {
        query = query.order('difficulty', { ascending: true });
      }
    } else {
      // Orden por defecto
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
    
    return data || [];
  },

  async getProfessorCourses(professorId) {
    const { data, error } = await supabase
      .from('professor_courses')
      .select(`
        course_id,
        courses (id, name, code)
      `)
      .eq('professor_id', professorId);

    if (error) throw error;
    return data.map(item => item.courses);
  },

  async getCourseProfessors(courseId) {
    const { data, error } = await supabase
      .from('professor_courses')
      .select(`
        professor_id,
        professors (id, full_name, department)
      `)
      .eq('course_id', courseId);

    if (error) throw error;
    return data.map(item => item.professors);
  }
};