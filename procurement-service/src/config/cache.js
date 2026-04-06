import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL || '180', 10),
  checkperiod: 60,
  useClones: false
});

export const getCache = (key) => cache.get(key);
export const setCache = (key, value, ttl) => cache.set(key, value, ttl);
export const invalidatePattern = (pattern) => {
  const keys = cache.keys().filter((key) => key.includes(pattern));
  keys.forEach((key) => cache.del(key));
  return keys.length;
};

export default cache;
