import { GlobalStorageServerConfigResolved } from '../config';
import { SingleInstanceStorage } from './single-instance';

let singleInstanceStorage: SingleInstanceStorage | null = null;

export function getStorage({ basePath }: GlobalStorageServerConfigResolved) {
  // todo: handle multi-instance storage
  if (!singleInstanceStorage) {
    // todo: re-create if basePath changed
    singleInstanceStorage = new SingleInstanceStorage({ basePath });
  }
  return singleInstanceStorage;
}

// todo: define IStorage interface
