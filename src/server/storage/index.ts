import { GlobalStorageServerConfigResolved } from '../config';
import { getFsStorage, getMemoryStorage } from './single-instance';

export function getStorage(
  { multiInstance, basePath }: GlobalStorageServerConfigResolved,
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
