import ms, { StringValue } from 'ms';

// time to live, can be a number of milliseconds, a string like "1h" or "infinite".
export type TTL = number | StringValue | 'infinite';

/**
 * TTL can be a stringified number or a string like "1h" or "infinite".
 */
export function parseTTL(ttl: string | number | undefined) {
  if (ttl === '' || ttl === undefined) return undefined;
  if (ttl === 'infinite') return -1;
  const ttlNumber = Number(ttl);
  return Number.isNaN(ttlNumber) ? ms(ttl as StringValue) : ttlNumber;
}

export function isExpired(computedAt: number, ttl: number) {
  if (!computedAt || ttl === -1) return false;
  return Date.now() > computedAt + ttl;
}
