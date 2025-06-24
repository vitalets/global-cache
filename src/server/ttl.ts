import ms, { StringValue } from 'ms';

// time to live, can be a string like "1h" or "forever"
export type TTL = StringValue | 'forever';

export function isExpired(updatedAt: number | undefined, ttl: TTL) {
  const ttlMs = toMs(ttl);
  if (!updatedAt || !ttlMs || ttlMs === -1) return false;
  return Date.now() > updatedAt + ttlMs;
}

function toMs(ttl?: TTL) {
  return ttl === 'forever' ? -1 : ttl ? ms(ttl) : undefined;
}
