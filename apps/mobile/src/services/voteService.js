// apps/mobile/src/services/voteService.js
import { supabase } from './supabaseClient';

/**
 * Vote Service - Manages review voting functionality
 */
export const VoteService = {
  /**
   * Toggle a vote on a review (add if not exists, remove if exists)
   * @param {string} reviewId - The review to vote on
   * @param {string} userId - The user casting the vote
   * @returns {Promise<{success: boolean, voted: boolean, voteCount: number, error?: string}>}
   */
  async toggleVote(reviewId, userId) {
    try {
      if (!reviewId || !userId) {
        return { success: false, voted: false, voteCount: 0, error: 'Missing reviewId or userId' };
      }

      // Check if user has already voted
      const { data: existingVote, error: checkError } = await supabase
        .from('review_votes')
        .select('id')
        .eq('review_id', reviewId)
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found (expected)
        console.error('Error checking vote:', checkError);
        return { success: false, voted: false, voteCount: 0, error: checkError.message };
      }

      let voted = false;

      if (existingVote) {
        // Remove the vote
        const { error: deleteError } = await supabase
          .from('review_votes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', userId);

        if (deleteError) {
          console.error('Error removing vote:', deleteError);
          return { success: false, voted: true, voteCount: 0, error: deleteError.message };
        }
        voted = false;
      } else {
        // Add the vote
        const { error: insertError } = await supabase
          .from('review_votes')
          .insert({
            review_id: reviewId,
            user_id: userId,
          });

        if (insertError) {
          console.error('Error adding vote:', insertError);
          return { success: false, voted: false, voteCount: 0, error: insertError.message };
        }
        voted = true;
      }

      // Get updated vote count
      const voteCount = await this.getVoteCount(reviewId);

      return {
        success: true,
        voted,
        voteCount,
      };
    } catch (error) {
      console.error('Error toggling vote:', error);
      return { success: false, voted: false, voteCount: 0, error: error.message };
    }
  },

  /**
   * Get the vote count for a review
   * @param {string} reviewId - The review ID
   * @returns {Promise<number>}
   */
  async getVoteCount(reviewId) {
    try {
      if (!reviewId) return 0;

      const { count, error } = await supabase
        .from('review_votes')
        .select('*', { count: 'exact', head: true })
        .eq('review_id', reviewId);

      if (error) {
        console.error('Error getting vote count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting vote count:', error);
      return 0;
    }
  },

  /**
   * Check if a user has voted on a review
   * @param {string} reviewId - The review ID
   * @param {string} userId - The user ID
   * @returns {Promise<boolean>}
   */
  async hasUserVoted(reviewId, userId) {
    try {
      if (!reviewId || !userId) return false;

      const { data, error } = await supabase
        .from('review_votes')
        .select('id')
        .eq('review_id', reviewId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking if user voted:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking if user voted:', error);
      return false;
    }
  },

  /**
   * Get vote counts for multiple reviews at once
   * @param {string[]} reviewIds - Array of review IDs
   * @returns {Promise<Object>} - Object mapping reviewId to vote count
   */
  async getBatchVoteCounts(reviewIds) {
    try {
      if (!reviewIds || reviewIds.length === 0) return {};

      const { data, error } = await supabase
        .from('review_votes')
        .select('review_id')
        .in('review_id', reviewIds);

      if (error) {
        console.error('Error getting batch vote counts:', error);
        return {};
      }

      // Count votes per review
      const counts = {};
      reviewIds.forEach(id => counts[id] = 0);
      
      (data || []).forEach(vote => {
        if (counts[vote.review_id] !== undefined) {
          counts[vote.review_id]++;
        } else {
          counts[vote.review_id] = 1;
        }
      });

      return counts;
    } catch (error) {
      console.error('Error getting batch vote counts:', error);
      return {};
    }
  },

  /**
   * Get votes for multiple reviews for a specific user
   * @param {string[]} reviewIds - Array of review IDs
   * @param {string} userId - The user ID
   * @returns {Promise<Set>} - Set of review IDs the user has voted on
   */
  async getBatchUserVotes(reviewIds, userId) {
    try {
      if (!reviewIds || reviewIds.length === 0 || !userId) return new Set();

      const { data, error } = await supabase
        .from('review_votes')
        .select('review_id')
        .in('review_id', reviewIds)
        .eq('user_id', userId);

      if (error) {
        console.error('Error getting batch user votes:', error);
        return new Set();
      }

      return new Set((data || []).map(vote => vote.review_id));
    } catch (error) {
      console.error('Error getting batch user votes:', error);
      return new Set();
    }
  },

  /**
   * Get all users who voted on a review
   * @param {string} reviewId - The review ID
   * @returns {Promise<Array>}
   */
  async getReviewVoters(reviewId) {
    try {
      if (!reviewId) return [];

      const { data, error } = await supabase
        .from('review_votes')
        .select('user_id, created_at')
        .eq('review_id', reviewId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting review voters:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting review voters:', error);
      return [];
    }
  },
};

export default VoteService;
