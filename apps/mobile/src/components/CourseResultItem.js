import React, { useState, useEffect } from 'react';
import SearchResultItem from './SearchResultItem';
import { supabase } from '../services/supabaseClient';

export default function CourseResultItem({ item, onPress }) {
  const [itemWithDetails, setItemWithDetails] = useState({ ...item });

  useEffect(() => {
    let alive = true;
    const fetchDetails = async () => {
      if (item.type === 'course') {
        // Fetch reviews with professor info
        const { data: reviews, error } = await supabase
          .from('reviews')
          .select('score, comment, professor_id, professors(full_name)')
          .eq('course_id', item.id);
        if (!alive) return;
        setItemWithDetails({
          ...item,
          reviews: reviews || [],
        });
      }
    };
    fetchDetails();
    return () => { alive = false; };
  }, [item]);

  return (
    <SearchResultItem item={itemWithDetails} onPress={() => onPress(itemWithDetails)} />
  );
}
