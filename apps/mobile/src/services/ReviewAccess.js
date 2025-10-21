import AsyncStorage from '@react-native-async-storage/async-storage';

const LIMIT = 3;
const WINDOW_MS = 24*60*60*1000;
const K = { start:'rv.windowStart', count:'rv.count', seen:'rv.seenSet' };

export async function canViewAnother(reviewId) {
  const now = Date.now();
  let start = Number(await AsyncStorage.getItem(K.start)) || now;
  let count = Number(await AsyncStorage.getItem(K.count)) || 0;
  let seen = new Set(JSON.parse((await AsyncStorage.getItem(K.seen)) || '[]'));

  if (now - start >= WINDOW_MS) { start = now; count = 0; seen = new Set(); }

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

  if (now - start >= WINDOW_MS) { start = now; count = 0; seen = new Set(); }
  if (reviewId && !seen.has(reviewId)) { seen.add(reviewId); count += 1; }

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
