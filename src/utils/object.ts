export function removeUndefined<T extends Record<string, unknown>>(obj?: T): T | undefined {
  if (!obj) return;
  return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== undefined)) as T;
}
