/**
 * Storage singleton, providing methods to load and save values.
 * It uses in-memory storage for fast access and file system for persistence.
 *
 * todo: make it extensible to support other storage backends.
 */
import { initValueInfo, isExpired, setMissing, ValueInfo } from '../value-info';
import { fsStorage } from './fs';

export class Storage {
  private data = new Map<string, ValueInfo>();

  // eslint-disable-next-line visual/complexity
  async load({ basePath, key, ttl }: { basePath: string; key: string; ttl?: number }) {
    let existingInfo = this.data.get(key);

    if (!existingInfo && ttl) {
      existingInfo = await fsStorage(basePath).get(key);
      // store value in memory for faster access next time
      if (existingInfo) {
        this.data.set(key, existingInfo);
      }
    }

    const valueInfo = existingInfo || initValueInfo(key);

    if (ttl) valueInfo.persistent = true;

    // check expired
    if (ttl && isExpired(valueInfo, ttl)) {
      setMissing(valueInfo);
      this.data.set(key, valueInfo);
      // todo: here we remove file, but later we create file again if compute = true
      await fsStorage(basePath).delete(key);
    }

    return valueInfo;
  }

  async save({
    basePath,
    valueInfo,
    ttl,
  }: {
    basePath: string;
    valueInfo: ValueInfo;
    ttl?: number;
  }) {
    const { state, key, value } = valueInfo;
    this.data.set(key, valueInfo);
    if (!ttl) return;
    if (state === 'computed') {
      await fsStorage(basePath).set(key, value);
    } else if (state === 'missing') {
      await fsStorage(basePath).delete(key);
    }
  }
}

export const storage = new Storage();
