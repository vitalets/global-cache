import { GlobalStorageServerConfigResolved } from '../config';
import { SingleInstanceStorage } from './single-instance';

// In-memory storage of test runs with values
const testRunStorageMap = new Map<string, SingleInstanceStorage>();

// todo: cleanup old testRuns from the map

export function getStorage({ basePath }: GlobalStorageServerConfigResolved, runId: string) {
  // todo: handle multi-instance storage
  let testRunStorage = testRunStorageMap.get(runId);
  if (!testRunStorage) {
    // todo: re-create if basePath changed
    testRunStorage = new SingleInstanceStorage({ basePath, runId });
    testRunStorageMap.set(runId, testRunStorage);
  }
  return testRunStorage;
}

// todo: define IStorage interface
