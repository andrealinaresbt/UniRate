import React, { useState, useEffect } from 'react';
import SearchResultItem from './SearchResultItem';
import { supabase } from '../services/supabaseClient';
import { countReportsFor } from '../services/reportService';
import { REPORT_THRESHOLD } from '../services/reviewService';

export default function CourseResultItem({ item, onPress }) {
  const [itemWithDetails, setItemWithDetails] = useState({ ...item });

  useEffect(() => {
    let alive = true;
    const fetchDetails = async () => {
      if (item.type === 'course') {
        // Fetch reviews with professor info
        const { data: reviews, error } = await supabase
          .from('reviews')
          .select('id, score, comment, professor_id, professors(full_name)')
          .eq('course_id', item.id);
        if (!alive) return;

        // filter hidden reviews
        const ids = (reviews || []).map(r => r.id).filter(Boolean);
        const counts = await countReportsFor(ids);
        const visible = (reviews || []).filter(r => (counts[r.id] || 0) < REPORT_THRESHOLD);

        setItemWithDetails({
          ...item,
          reviews: visible || [],
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
