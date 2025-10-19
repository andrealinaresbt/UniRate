import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet
} from 'react-native';
import { filterService } from '../services/filterService';
import RangeSlider from './RangeSlider';

const SORT_OPTIONS = [
  { label: 'Más recientes', value: 'newest' },
  { label: 'Más antiguas', value: 'oldest' },
  { label: 'Mejor calificación', value: 'highest_rating' },
  { label: 'Peor calificación', value: 'lowest_rating' },
  { label: 'Mayor dificultad', value: 'highest_difficulty' },
  { label: 'Menor dificultad', value: 'lowest_difficulty' }
];

export default function FilterModal({ 
  visible, 
  onClose, 
  onApplyFilters, 
  context = {},
  currentFilters = {} 
}) {
  const [filters, setFilters] = useState({
    courseId: null,
    professorId: null,
    minRating: 1,
    maxRating: 5,
    minDifficulty: 1,
    maxDifficulty: 5,
    sortBy: 'newest',
    ...currentFilters
  });

  const [courses, setCourses] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadFilterOptions();
      // Resetear valores si no hay filtros activos
      if (Object.keys(currentFilters).length === 0) {
        setFilters(prev => ({
          ...prev,
          minRating: 1,
          maxRating: 5,
          minDifficulty: 1,
          maxDifficulty: 5
        }));
      }
    }
  }, [visible, context]);

  const loadFilterOptions = async () => {
    setLoading(true);
    try {
      if (context.professorId) {
        const professorCourses = await filterService.getProfessorCourses(context.professorId);
        setCourses(professorCourses);
      } else if (context.courseId) {
        const courseProfessors = await filterService.getCourseProfessors(context.courseId);
        setProfessors(courseProfessors);
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.courseId) count++;
    if (filters.professorId) count++;
    if (filters.minRating > 1 || filters.maxRating < 5) count++;
    if (filters.minDifficulty > 1 || filters.maxDifficulty < 5) count++;
    if (filters.sortBy && filters.sortBy !== 'newest') count++;
    return count;
  };

  const isFilterActive = () => {
    return getActiveFiltersCount() > 0;
  };

  const handleApply = () => {
    // Preparar filtros para enviar (solo enviar si no es el rango completo o valor por defecto)
    const filtersToApply = {};
    
    // Solo incluir courseId si tiene valor
    if (filters.courseId) {
      filtersToApply.courseId = filters.courseId;
    }
    
    // Solo incluir professorId si tiene valor
    if (filters.professorId) {
      filtersToApply.professorId = filters.professorId;
    }
    
    // Solo incluir rating si no es el rango completo
    if (filters.minRating > 1) {
      filtersToApply.minRating = filters.minRating;
    }
    if (filters.maxRating < 5) {
      filtersToApply.maxRating = filters.maxRating;
    }
    
    // Solo incluir difficulty si no es el rango completo
    if (filters.minDifficulty > 1) {
      filtersToApply.minDifficulty = filters.minDifficulty;
    }
    if (filters.maxDifficulty < 5) {
      filtersToApply.maxDifficulty = filters.maxDifficulty;
    }
    
    // Solo incluir sortBy si no es el valor por defecto
    if (filters.sortBy && filters.sortBy !== 'newest') {
      filtersToApply.sortBy = filters.sortBy;
    }

    console.log('Enviando filtros aplicados:', filtersToApply);
    onApplyFilters(filtersToApply);
    onClose();
  };

  const handleRatingChange = (min, max) => {
    setFilters(prev => ({
      ...prev,
      minRating: min,
      maxRating: max
    }));
  };

  const handleDifficultyChange = (min, max) => {
    setFilters(prev => ({
      ...prev,
      minDifficulty: min,
      maxDifficulty: max
    }));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Filtros de Búsqueda</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Filtro por Materia (solo en perfil de profesor) */}
          {context.professorId && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Materia</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                <TouchableOpacity
                  style={[
                    styles.option,
                    !filters.courseId && styles.optionSelected
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, courseId: null }))}
                >
                  <Text style={[styles.optionText, !filters.courseId && styles.optionTextSelected]}>
                    Todas
                  </Text>
                </TouchableOpacity>
                {courses.map(course => (
                  <TouchableOpacity
                    key={course.id}
                    style={[
                      styles.option,
                      filters.courseId === course.id && styles.optionSelected
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, courseId: course.id }))}
                  >
                    <Text style={[styles.optionText, filters.courseId === course.id && styles.optionTextSelected]}>
                      {course.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Filtro por Profesor (solo en perfil de materia) */}
          {context.courseId && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Profesor</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                <TouchableOpacity
                  style={[
                    styles.option,
                    !filters.professorId && styles.optionSelected
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, professorId: null }))}
                >
                  <Text style={[styles.optionText, !filters.professorId && styles.optionTextSelected]}>
                    Todos
                  </Text>
                </TouchableOpacity>
                {professors.map(professor => (
                  <TouchableOpacity
                    key={professor.id}
                    style={[
                      styles.option,
                      filters.professorId === professor.id && styles.optionSelected
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, professorId: professor.id }))}
                  >
                    <Text style={[styles.optionText, filters.professorId === professor.id && styles.optionTextSelected]}>
                      {professor.full_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Filtro por Calificación con RangeSlider */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Calificación ⭐</Text>
            <View style={styles.sliderSection}>
              <Text style={styles.sliderDescription}>
                {filters.minRating === 1 && filters.maxRating === 5 
                  ? 'Todas las calificaciones' 
                  : `De ${filters.minRating} a ${filters.maxRating} estrellas`}
              </Text>
              <RangeSlider
                min={1}
                max={5}
                initialLow={filters.minRating}
                initialHigh={filters.maxRating}
                onValueChange={handleRatingChange}
                step={1}
              />
            </View>
          </View>

          {/* Filtro por Dificultad con RangeSlider */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dificultad 📉</Text>
            <View style={styles.sliderSection}>
              <Text style={styles.sliderDescription}>
                {filters.minDifficulty === 1 && filters.maxDifficulty === 5 
                  ? 'Todos los niveles de dificultad' 
                  : `De ${filters.minDifficulty} a ${filters.maxDifficulty}`}
              </Text>
              <RangeSlider
                min={1}
                max={5}
                initialLow={filters.minDifficulty}
                initialHigh={filters.maxDifficulty}
                onValueChange={handleDifficultyChange}
                step={1}
              />
            </View>
          </View>

          {/* Ordenar por */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ordenar por</Text>
            <View style={styles.optionsGrid}>
              {SORT_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    styles.optionLarge,
                    filters.sortBy === option.value && styles.optionSelected
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, sortBy: option.value }))}
                >
                  <Text style={[styles.optionText, filters.sortBy === option.value && styles.optionTextSelected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Botones de acción */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[
              styles.applyButton,
              !isFilterActive() && styles.applyButtonDisabled
            ]}
            onPress={handleApply}
            disabled={!isFilterActive()}
          >
            <Text style={styles.applyButtonText}>
              Aplicar {getActiveFiltersCount() > 0 ? `(${getActiveFiltersCount()})` : ''}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 20,
    color: '#666',
    fontWeight: '300',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  optionsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginRight: 8,
    marginBottom: 8,
  },
  optionLarge: {
    minWidth: '48%',
    flex: 1,
  },
  optionSelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sliderSection: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  sliderDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  applyButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: '#E9ECEF',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});