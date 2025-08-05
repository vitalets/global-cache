/**
 * Single-instance mode of Global Storage Server.
 * - non-persistent values are stored in memory
 * - presistent values are stored on fs and cached in memory
 * - waiting for value performed via memory
 */
import {
  initValueInfo,
  isExpired,
  setComputing,
  setError,
  setMissing,
  setValue,
  ValueInfo,
} from '../../value-info';
import { FileSystemStorage } from './fs';
import { Waiters } from './waiters';

export type SingleInstanceStorageConfig = {
  basePath: string; // path to the directory where persistent values are stored
};

export class SingleInstanceStorage {
  private data = new Map<string, ValueInfo>();
  private fsStorage: FileSystemStorage;
  private waiters = new Waiters();

  constructor(config: SingleInstanceStorageConfig) {
    this.fsStorage = new FileSystemStorage(config.basePath);
  }

  // eslint-disable-next-line visual/complexity
  async loadInfo({ key, ttl }: { key: string; ttl?: number }) {
    let loadedInfo = this.data.get(key);

    if (!loadedInfo && ttl) {
      loadedInfo = await this.fsStorage.get(key);
      // store value in memory for faster access next time
      if (loadedInfo) {
        this.data.set(key, loadedInfo);
      }
    }

    const valueInfo = loadedInfo || initValueInfo(key);

    if (ttl) valueInfo.persistent = true;

    // check expired
    if (ttl && isExpired(valueInfo, ttl)) {
      setMissing(valueInfo);
      this.data.set(key, valueInfo);
      // todo: here we remove file, but later we create file again if compute = true -> can be optimized
      await this.fsStorage.delete(key);
    }

    return valueInfo;
  }

  async setComputing(valueInfo: ValueInfo) {
    setComputing(valueInfo);
    this.data.set(valueInfo.key, valueInfo);
  }

  async waitValue(key: string) {
    return this.waiters.wait(key);
  }

  async setValue({
    key,
    ttl,
    value,
    error,
  }: {
    key: string;
    ttl?: number;
    value?: unknown;
    error?: string;
  }) {
    const valueInfo = await this.loadInfo({ key, ttl });
    if (error) {
      setError(valueInfo);
      this.data.set(key, valueInfo);
      this.waiters.notifyError(key, error);
      if (ttl) await this.fsStorage.delete(key);
    } else {
      setValue(valueInfo, value);
      this.data.set(key, valueInfo);
      this.waiters.notifyValue(key, value);
      if (ttl) await this.fsStorage.set(key, value);
    }
  }

  async getStale(key: string) {
    // for stale we return only values from memory - used in this test-run.
    const valueInfo = this.data.get(key);
    // todo: move this logic to value-info or route handler
    return valueInfo?.persistent ? valueInfo.oldValue : valueInfo?.value;
  }

  async getStaleList(prefix: string) {
    return (
      [...this.data.values()]
        .filter((valueInfo) => valueInfo.key.startsWith(prefix))
        // todo: move this logic to value-info or route handler
        .map((valueInfo) => (valueInfo.persistent ? valueInfo.oldValue : valueInfo.value))
    );
  }

  /**
   * Clears all non-persistent values for this session.
   */
  async clearSession() {
    this.data.clear();
  }
}
