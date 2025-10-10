/**
 * Single-instance mode of Global Storage Server.
 * - non-persistent values are stored in memory
 * - presistent values are stored on file system
 * - compute-listeners are implemented via memory
 */
import { MemoryStorage } from './memory';
import { FilesystemStorage } from './fs';

// In-memory storage of test runs with values
const memoryStorageMap = new Map<string, MemoryStorage>();
const fsStorageMap = new Map<string, FilesystemStorage>();

// todo: cleanup old testRuns from the map

export function getMemoryStorage(runId: string) {
  let storage = memoryStorageMap.get(runId);
  if (!storage) {
    storage = new MemoryStorage();
    memoryStorageMap.set(runId, storage);
  }
  return storage;
}

export function getFsStorage(basePath: string) {
  let storage = fsStorageMap.get(basePath);
  if (!storage) {
    storage = new FilesystemStorage(basePath);
    fsStorageMap.set(basePath, storage);
  }
  return storage;
}
