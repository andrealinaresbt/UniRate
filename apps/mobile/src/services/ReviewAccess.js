import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient'; // adjusted path to your supabase client

const LIMIT = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000;
const K = { start: 'rv.windowStart', count: 'rv.count', seen: 'rv.seenSet' };

// ===== anon helpers (existing) =====
export async function canViewAnother(reviewId) {
  const now = Date.now();
  let start = Number(await AsyncStorage.getItem(K.start)) || now;
  let count = Number(await AsyncStorage.getItem(K.count)) || 0;
  let seen = new Set(JSON.parse((await AsyncStorage.getItem(K.seen)) || '[]'));

  if (now - start >= WINDOW_MS) {
    start = now;
    count = 0;
    seen = new Set();
  }

  if (reviewId && seen.has(reviewId)) {
    await AsyncStorage.setItem(K.start, String(start));
    return { allowed: true, remaining: Math.max(0, LIMIT - count) };
  }
  if (count >= LIMIT) return { allowed: false, remaining: 0 };
  return { allowed: true, remaining: LIMIT - count };
}

export async function registerView(reviewId) {
  const now = Date.now();
  let start = Number(await AsyncStorage.getItem(K.start)) || now;
  let count = Number(await AsyncStorage.getItem(K.count)) || 0;
  let seen = new Set(JSON.parse((await AsyncStorage.getItem(K.seen)) || '[]'));

  if (now - start >= WINDOW_MS) {
    start = now;
    count = 0;
    seen = new Set();
  }
  if (reviewId && !seen.has(reviewId)) {
    seen.add(reviewId);
    count += 1;
  }

  await AsyncStorage.multiSet([
    [K.start, String(start)],
    [K.count, String(count)],
    [K.seen, JSON.stringify(Array.from(seen).slice(-200))]
  ]);
  return { count, remaining: Math.max(0, LIMIT - count) };
}

export async function resetAnonCounters() {
  await AsyncStorage.multiRemove([K.start, K.count, K.seen]);
}

// ===== authed helpers (new) =====
const AUTHED_LIMIT = 5;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

// helper to read fresh profile row
async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('id, reviews_read_count, last_review_written_at')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

// export: check if signed-in user may view another review
export async function canAuthedViewAnother(userId) {
  if (!userId) return { allowed: false, reason: 'no-user' };
  const p = await fetchProfile(userId);
  const last = p.last_review_written_at ? new Date(p.last_review_written_at).getTime() : null;
  const fresh = last && (Date.now() - last) < MONTH_MS;

  if (p.reviews_read_count > AUTHED_LIMIT && !fresh) {
    return { allowed: false, reason: 'needs-review' };
  }
  return { allowed: true, remaining: Math.max(0, AUTHED_LIMIT - p.reviews_read_count) };
}

// export: increment read counter (client-side)
export async function registerAuthedReviewView(userId) {
  if (!userId) return;
  const { data, error } = await supabase
    .from('users')
    .select('reviews_read_count')
    .eq('id', userId)
    .single();

  if (error) throw error;

  const current = data?.reviews_read_count ?? 0;
  const next = current + 1;

  const { error: upErr } = await supabase
    .from('users')
    .update({ reviews_read_count: next })
    .eq('id', userId);

  if (upErr) throw upErr;
  return next;
}


// optional: call after publishing a review
export async function markReviewWritten(userId) {
  if (!userId) return;
  const { error } = await supabase
    .from('users')
    .update({ last_review_written_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
}
