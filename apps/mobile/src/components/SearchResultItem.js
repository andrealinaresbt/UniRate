import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Platform } from 'react-native';

export const SearchResultItem = ({ item, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    {/* Contenido principal */}
    <View style={styles.content}>
      {/* Header con nombre y badge alineados */}
      <View style={styles.header}>
        <View style={styles.textContainer}>
          <Text style={styles.resultName} numberOfLines={2}>
            {item.full_name || item.name}
          </Text>
          
          {/* Información específica */}
          {item.type === 'professor' && item.department && (
            <Text style={styles.infoText} numberOfLines={1}>
              {item.department}
            </Text>
          )}
          {item.type === 'course' && item.code && (
            <Text style={styles.infoText} numberOfLines={1}>
              Código: {item.code}
            </Text>
          )}
        </View>
        
        {/* Badge a la derecha */}
        <View style={[
          styles.typeBadge, 
          item.type === 'professor' ? styles.professorBadge : styles.courseBadge
        ]}>
          <Text style={styles.typeText}>
            {item.type === 'professor' ? 'Profesor' : 'Materia'}
          </Text>
        </View>
      </View>

      {/* Rating y reviews en línea */}
      <View style={styles.footer}>
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingIcon}>⭐</Text>
          <Text style={styles.ratingText}>
            {item.avg_score !== null && item.avg_score !== undefined && item.avg_score !== 'NaN' && !isNaN(Number(item.avg_score))
              ? Number(item.avg_score).toFixed(2)
              : 'N/A'}
          </Text>
        </View>

        {/* Cantidad de reseñas */}
        {item.review_count !== undefined && item.review_count > 0 && (
          <Text style={styles.reviewCount}>
            {item.review_count} {item.review_count === 1 ? 'reseña' : 'reseñas'}
          </Text>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 16,
    marginHorizontal: 2,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  resultName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#003087',
    marginBottom: 4,
    lineHeight: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  professorBadge: {
    backgroundColor: '#2b529a',
  },
  courseBadge: {
    backgroundColor: '#ff8200',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003087',
  },
  reviewCount: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
});

export default SearchResultItem;