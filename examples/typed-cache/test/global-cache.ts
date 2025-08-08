import { globalCache as genericGlobalCache, GlobalCache } from '@vitalets/global-cache';

export type GlobalCacheSchema = {
  'user-id': string;
  'user-info': { name: string; email: string };
  // ...add more keys as needed
};

// Re-export typed globalCache
export const globalCache = genericGlobalCache as GlobalCache<GlobalCacheSchema>;
