const { Redis } = require('@upstash/redis');

let redis = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  console.log('[Cache] Upstash Redis connected');
} else {
  console.log('[Cache] No Redis config — caching disabled');
}

// TTLs (seconds)
const TTL = {
  SHORT: 60,        // 1 min  — dashboard stats
  MEDIUM: 300,      // 5 min  — transaction lists
  LONG: 3600,       // 1 hour — customer/property lists
};

async function cacheGet(key) {
  if (!redis) return null;
  try {
    return await redis.get(key);
  } catch (e) {
    console.error('[Cache] GET error:', e?.message);
    return null;
  }
}

async function cacheSet(key, value, ttl = TTL.MEDIUM) {
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: ttl });
  } catch (e) {
    console.error('[Cache] SET error:', e?.message);
  }
}

async function cacheDel(...keys) {
  if (!redis) return;
  try {
    for (const key of keys) await redis.del(key);
  } catch (e) {
    console.error('[Cache] DEL error:', e?.message);
  }
}

// Invalidate all keys matching a pattern prefix
async function cacheInvalidatePrefix(prefix) {
  if (!redis) return;
  try {
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length > 0) {
      for (const k of keys) await redis.del(k);
    }
  } catch (e) {
    console.error('[Cache] invalidate prefix error:', e?.message);
  }
}

module.exports = { cacheGet, cacheSet, cacheDel, cacheInvalidatePrefix, TTL };
