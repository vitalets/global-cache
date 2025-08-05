import { globalStorage } from '@vitalets/global-storage';

export default async function cleanup() {
  // Remove user from db, when it's not needed any more
  const userId = await globalStorage.getStale('db-user-id');
  if (userId) {
    console.log(`Removing user from db: ${userId}`);
  }
}
