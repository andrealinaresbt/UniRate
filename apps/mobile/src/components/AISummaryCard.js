// apps/mobile/src/components/AISummaryCard.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { AISummaryService } from '../services/aiSummaryService';

const COLORS = {
  seasalt: "#F6F7F8",
  utOrange: "#FF8200",
  columbiaBlue: "#CFE1FB",
  yinmnBlue: "#4C78C9",
  resolutionBlue: "#003087",
};

/**
 * Componente para mostrar resumen generado por IA
 * @param {string} entityType - 'professor' o 'course'
 * @param {string} entityId - ID del profesor o curso
 * @param {Array} reviews - Array de reseñas para generar el resumen
 * @param {string} entityName - Nombre del profesor o curso (para mostrar en loading)
 */
export default function AISummaryCard({ entityType, entityId, reviews, entityName }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadSummary();
  }, [entityId, reviews?.length]);

  const loadSummary = async () => {
    if (!reviews || reviews.length < 3) {
      setSummary(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = entityType === 'professor'
        ? await AISummaryService.getProfessorSummary(entityId, reviews)
        : await AISummaryService.getCourseSummary(entityId, reviews);

      if (result.success && result.summary) {
        setSummary(result.summary);
      } else if (result.message) {
        // No hay suficientes reseñas
        setSummary(null);
      } else {
        setError(result.error || 'Error al generar resumen');
      }
    } catch (err) {
      console.error('Error loading AI summary:', err);
      setError('No se pudo cargar el resumen');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = entityType === 'professor'
        ? await AISummaryService.getProfessorSummary(entityId, reviews, true)
        : await AISummaryService.getCourseSummary(entityId, reviews, true);

      if (result.success && result.summary) {
        setSummary(result.summary);
      } else {
        setError(result.error || 'Error al regenerar resumen');
      }
    } catch (err) {
      console.error('Error regenerating summary:', err);
      setError('No se pudo regenerar el resumen');
    } finally {
      setLoading(false);
    }
  };

  // No mostrar nada si no hay suficientes reseñas
  if (!reviews || reviews.length < 3) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.aiIcon}>✨</Text>
          <Text style={styles.title}>Resumen IA</Text>
        </View>
        {summary && !loading && (
          <TouchableOpacity 
            onPress={handleRegenerate}
            style={styles.regenerateButton}
          >
            <Text style={styles.regenerateText}>🔄</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.yinmnBlue} />
          <Text style={styles.loadingText}>Generando resumen...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={loadSummary} style={styles.retryButton}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : summary ? (
        <View>
          <Text 
            style={styles.summaryText}
            numberOfLines={isExpanded ? undefined : 4}
          >
            {summary}
          </Text>
          {summary.length > 200 && (
            <TouchableOpacity 
              onPress={() => setIsExpanded(!isExpanded)}
              style={styles.expandButton}
            >
              <Text style={styles.expandText}>
                {isExpanded ? 'Ver menos' : 'Ver más'}
              </Text>
            </TouchableOpacity>
          )}
          <Text style={styles.disclaimer}>
            Resumen generado por IA basado en {reviews.length} reseña{reviews.length !== 1 ? 's' : ''}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.columbiaBlue,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.yinmnBlue + '30',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.resolutionBlue,
  },
  regenerateButton: {
    padding: 4,
  },
  regenerateText: {
    fontSize: 18,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: COLORS.yinmnBlue,
    fontStyle: 'italic',
  },
  errorContainer: {
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    marginBottom: 8,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.yinmnBlue,
    borderRadius: 6,
  },
  retryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.resolutionBlue,
    marginBottom: 8,
  },
  expandButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 8,
  },
  expandText: {
    fontSize: 13,
    color: COLORS.yinmnBlue,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 11,
    color: COLORS.yinmnBlue + 'AA',
    fontStyle: 'italic',
    marginTop: 4,
  },
});
