  import React from 'react';
  import { 
    TouchableOpacity, 
    View, 
    Text, 
    StyleSheet, 
    Platform 
  } from 'react-native';

  export const SearchResultItem = ({ item, onPress }) => (
    <TouchableOpacity style={styles.resultItem} onPress={onPress}>
      <View style={styles.content}>
        {/* Header con nombre y badge */}
        <View style={styles.header}>
          <Text style={styles.resultName} numberOfLines={2}>
            {item.full_name || item.name}
          </Text>
          <View style={[
            styles.typeBadge, 
            item.type === 'professor' ? styles.professorBadge : styles.courseBadge
          ]}>
            <Text style={styles.typeText}>
              {item.type === 'professor' ? 'Profesor' : 'Materia'}
            </Text>
          </View>
        </View>
        
        {/* Información específica */}
        <View style={styles.infoContainer}>
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

        {/* Rating y reviews */}
        <View style={styles.footer}>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingIcon}>⭐</Text>
            <Text style={styles.ratingText}>
              {item.avg_score || 'N/A'}
            </Text>
          </View>
          
          {item.review_count > 0 && (
            <Text style={styles.reviewCount}>
              {item.review_count} {item.review_count === 1 ? 'reseña' : 'reseñas'}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    resultItem: {
      backgroundColor: '#F1F1F1',
      borderRadius: 20, 
      marginBottom: 12,
      padding: 0, 
      ...Platform.select({
        ios: {
          shadowColor: '#003087',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
        android: {
          elevation: 3,
          shadowColor: '#003087',
        },
      }),
    },
    content: {
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    resultName: {
      fontSize: 18,
      fontWeight: '600',
      color: '#003087',
      flex: 1,
      marginRight: 12,
      lineHeight: 24,
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
       color: '#f6f7f8',
    },
    infoContainer: {
      marginBottom: 16,
    },
    infoText: {
      fontSize: 14,
      color: '#666',
      lineHeight: 20,
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