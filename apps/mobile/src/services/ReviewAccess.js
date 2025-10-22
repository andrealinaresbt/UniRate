import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient'; // adjusted path to your supabase client

const LIMIT = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000;
const K = { start: 'rv.windowStart', count: 'rv.count', seen: 'rv.seenSet' };
const TABLE_READS = 'review_reads';

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
    .select('id, last_review_written_at')
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

  // count distinct reviews read by this user
  const { count, error: cErr } = await supabase
    .from('review_reads')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (cErr) throw cErr;

  if ((count ?? 0) > AUTHED_LIMIT && !fresh) {
    return { allowed: false, reason: 'needs-review' };
  }
  return { allowed: true, remaining: Math.max(0, AUTHED_LIMIT - (count ?? 0)) };
}

// export: upsert a unique (user_id, review_id) read
export async function registerAuthedReviewView(userId, reviewId) {
  if (!userId || !reviewId) return;
  // UUID guard helps catch route params that aren't DB uuids
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(reviewId));
  if (!isUUID) {
    console.log('[review_reads] bad reviewId format', reviewId);
    return;
  }
  const sess = await supabase.auth.getSession();
  console.log('[review_reads] session?', !!sess.data.session, 'user', sess.data.session?.user?.id);

  const { error } = await supabase
    .from('review_reads')
    .upsert(
      { user_id: userId, review_id: reviewId },
      { onConflict: 'user_id,review_id', ignoreDuplicates: true, returning: 'minimal' }
    );
  if (error) { console.log('[review_reads upsert error]', error); throw error; }
  return true;
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
