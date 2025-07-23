import ms, { StringValue } from 'ms';

// time to live, can be a number of milliseconds, a string like "1h" or "infinite".
export type TTL = number | StringValue | 'infinite';

// export function isExpired(updatedAt: number | undefined, ttl: number) {
//   if (!updatedAt || ttl === -1) return false;
//   return Date.now() > updatedAt + ttl;
// }

/**
 * TTL can be a stringified number or a string like "1h" or "infinite".
 */
export function parseTTL(ttl: string | number | undefined) {
  if (ttl === '' || ttl === undefined) return undefined;
  if (ttl === 'infinite') return -1;
  const ttlNumber = Number(ttl);
  return Number.isNaN(ttlNumber) ? ms(ttl as StringValue) : ttlNumber;
}
