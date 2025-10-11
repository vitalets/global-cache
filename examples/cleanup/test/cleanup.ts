import { globalCache } from '@global-cache/playwright';

export default async function cleanup() {
  const userId = await globalCache.getStale('db-user-id');
  if (userId) {
    console.log(`\nRemoving user from db: ${userId}\n`);
  }
}
