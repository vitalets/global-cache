import { GlobalCacheServerConfigResolved } from '../config';
import { getFsStorage, getMemoryStorage } from './single-instance';

export function getStorage(
  { multiInstance, basePath }: GlobalCacheServerConfigResolved,
  runId: string,
) {
  if (multiInstance) {
    throw new Error('Multi-instance mode is not implemented yet.');
  }

  return {
    testRunStorage: getMemoryStorage(runId),
    persistentStorage: getFsStorage(basePath),
  };
}
