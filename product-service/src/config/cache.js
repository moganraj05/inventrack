import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes default
  checkperiod: 60,
  useClones: false
});

export const getCache = (key) => cache.get(key);
export const setCache = (key, value, ttl) => cache.set(key, value, ttl);
export const delCache = (key) => cache.del(key);
export const flushCache = () => cache.flushAll();

// Flush cache keys matching a pattern
export const invalidatePattern = (pattern) => {
  const keys = cache.keys();
  const matching = keys.filter(k => k.includes(pattern));
  matching.forEach(k => cache.del(k));
  return matching.length;
};

export default cache;
