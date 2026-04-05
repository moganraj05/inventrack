import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL) || 120, checkperiod: 60 });

export const getCache = (key) => cache.get(key);
export const setCache = (key, value, ttl) => cache.set(key, value, ttl);
export const delCache = (key) => cache.del(key);
export const invalidatePattern = (pattern) => {
  const keys = cache.keys();
  keys.filter(k => k.includes(pattern)).forEach(k => cache.del(k));
};

export default cache;
