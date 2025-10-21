// components/FilterModal.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Platform
} from 'react-native';
import { filterService } from '../services/filterService';
import RangeSlider from './RangeSlider';
import DateTimePicker from '@react-native-community/datetimepicker';

const COLORS = {
  seasalt: "#F6F7F8",
  utOrange: "#FF8200",
  columbiaBlue: "#CFE1FB",
  yinmnBlue: "#4C78C9",
  resolutionBlue: "#003087",
};

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
    startDate: null,
    endDate: null,
    sortBy: 'newest',
  });

  const [courses, setCourses] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);

  // Resetear filtros cuando el modal se abre/cierra o currentFilters cambia
  useEffect(() => {
    if (visible) {
      loadFilterOptions();
      
      if (Object.keys(currentFilters).length > 0) {
        const syncedFilters = {
          courseId: currentFilters.courseId || null,
          professorId: currentFilters.professorId || null,
          minRating: currentFilters.minRating !== undefined ? currentFilters.minRating : 1,
          maxRating: currentFilters.maxRating !== undefined ? currentFilters.maxRating : 5,
          minDifficulty: currentFilters.minDifficulty !== undefined ? currentFilters.minDifficulty : 1,
          maxDifficulty: currentFilters.maxDifficulty !== undefined ? currentFilters.maxDifficulty : 5,
          startDate: currentFilters.startDate ? new Date(currentFilters.startDate) : null,
          endDate: currentFilters.endDate ? new Date(currentFilters.endDate) : null,
          sortBy: currentFilters.sortBy || 'newest',
        };
        
        setFilters(syncedFilters);
      }
      
      setTempStartDate(null);
      setTempEndDate(null);
    }
  }, [visible, currentFilters]);

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
    if (filters.startDate || filters.endDate) count++;
    if (filters.sortBy && filters.sortBy !== 'newest') count++;
    return count;
  };

  const isFilterActive = () => {
    return getActiveFiltersCount() > 0;
  };

  const handleApply = () => {
    const filtersToApply = {};
    
    if (filters.courseId) {
      filtersToApply.courseId = filters.courseId;
    }
    
    if (filters.professorId) {
      filtersToApply.professorId = filters.professorId;
    }
    
    if (filters.minRating > 1) {
      filtersToApply.minRating = filters.minRating;
    }
    if (filters.maxRating < 5) {
      filtersToApply.maxRating = filters.maxRating;
    }
    
    if (filters.minDifficulty > 1) {
      filtersToApply.minDifficulty = filters.minDifficulty;
    }
    if (filters.maxDifficulty < 5) {
      filtersToApply.maxDifficulty = filters.maxDifficulty;
    }

    if (filters.startDate) {
      filtersToApply.startDate = filters.startDate.toISOString().split('T')[0];
    }
    if (filters.endDate) {
      filtersToApply.endDate = filters.endDate.toISOString().split('T')[0];
    }
    
    if (filters.sortBy && filters.sortBy !== 'newest') {
      filtersToApply.sortBy = filters.sortBy;
    }

    console.log('Enviando filtros aplicados:', filtersToApply);
    onApplyFilters(filtersToApply);
    onClose();
  };

  const handleClearAll = () => {
    const defaultFilters = {
      courseId: null,
      professorId: null,
      minRating: 1,
      maxRating: 5,
      minDifficulty: 1,
      maxDifficulty: 5,
      startDate: null,
      endDate: null,
      sortBy: 'newest'
    };
    setFilters(defaultFilters);
    setTempStartDate(null);
    setTempEndDate(null);
    onApplyFilters({});
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

  const handleStartDatePress = () => {
    setTempStartDate(filters.startDate || new Date());
    setShowStartDatePicker(true);
  };

  const handleEndDatePress = () => {
    setTempEndDate(filters.endDate || new Date());
    setShowEndDatePicker(true);
  };

  const handleStartDateChange = (event, selectedDate) => {
    if (event.type === 'set' && selectedDate) {
      setFilters(prev => ({
        ...prev,
        startDate: selectedDate
      }));
    }
    setShowStartDatePicker(false);
    setTempStartDate(null);
  };

  const handleEndDateChange = (event, selectedDate) => {
    if (event.type === 'set' && selectedDate) {
      setFilters(prev => ({
        ...prev,
        endDate: selectedDate
      }));
    }
    setShowEndDatePicker(false);
    setTempEndDate(null);
  };

  const clearStartDate = () => {
    setFilters(prev => ({ ...prev, startDate: null }));
  };

  const clearEndDate = () => {
    setFilters(prev => ({ ...prev, endDate: null }));
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('es-ES');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen" // Cambiado a overFullScreen
      onRequestClose={onClose}
      supportedOrientations={['portrait']}
    >
      
      <View style={styles.modalContainer}>
        {/* Header con botón Limpiar a la izquierda */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleClearAll} 
            style={[
              styles.clearButton,
              !isFilterActive() && styles.clearButtonDisabled
            ]}
            disabled={!isFilterActive()}
          >
            <Text style={[
              styles.clearButtonText,
              !isFilterActive() && styles.clearButtonTextDisabled
            ]}>
              Limpiar
            </Text>
          </TouchableOpacity>
          <Text style={styles.title}>Filtros de Búsqueda</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Filtro por Materia */}
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

          {/* Filtro por Profesor */}
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

          {/* Filtro por Rango de Fechas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rango de Fechas</Text>
            <View style={styles.dateSection}>
              <View style={styles.dateRow}>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateLabel}>Desde:</Text>
                  <TouchableOpacity 
                    style={styles.dateButton}
                    onPress={handleStartDatePress}
                  >
                    <Text style={styles.dateButtonText}>
                      {formatDate(filters.startDate) || ''}
                    </Text>
                  </TouchableOpacity>
                  {filters.startDate && (
                    <TouchableOpacity onPress={clearStartDate} style={styles.clearDateButton}>
                      <Text style={styles.clearDateText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateLabel}>Hasta:</Text>
                  <TouchableOpacity 
                    style={styles.dateButton}
                    onPress={handleEndDatePress}
                  >
                    <Text style={styles.dateButtonText}>
                      {formatDate(filters.endDate) || ''}
                    </Text>
                  </TouchableOpacity>
                  {filters.endDate && (
                    <TouchableOpacity onPress={clearEndDate} style={styles.clearDateButton}>
                      <Text style={styles.clearDateText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Filtro por Calificación */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Calificación</Text>
            <View style={styles.sliderSection}>
              <View style={styles.sliderContainer}>
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
          </View>

          {/* Filtro por Dificultad */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dificultad</Text>
            <View style={styles.sliderSection}>
              <View style={styles.sliderContainer}>
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

        {/* Date Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={tempStartDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleStartDateChange}
          />
        )}
        {showEndDatePicker && (
          <DateTimePicker
            value={tempEndDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleEndDateChange}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    // Padding top para respetar la status bar
    paddingTop: Platform.OS === 'ios' ? 50 : 24,
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
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FF8200',
  },
  clearButtonDisabled: {
    backgroundColor: '#E9ECEF',
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  clearButtonTextDisabled: {
    color: '#999',
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
    backgroundColor: '#FF8200',
    borderColor: '#FF8200',
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
    paddingHorizontal: 30,
    padding: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginHorizontal: 15,
  },
  sliderContainer: {
    marginHorizontal: 1,
  },
  dateSection: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  dateInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginRight: 8,
    minWidth: 50,
  },
  dateButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  dateButtonText: {
    fontSize: 10,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  clearDateButton: {
    padding: 8,
    marginLeft: 8,
  },
  clearDateText: {
    fontSize: 14,
    color: '#FF8200',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  applyButton: {
    backgroundColor: '#FF8200',
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