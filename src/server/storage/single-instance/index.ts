/**
 * Single-instance mode of Global Storage Server.
 * - non-persistent values are stored in memory
 * - presistent values are stored on fs and loaded to memory on the first request
 * - waiting for value is performed via memory
 */
import { checkSignature } from '../../../shared/sig';
import { isExpired } from '../../../shared/ttl';
import { assignValueInfo, ValueInfo } from '../../../shared/value-info';
import { FileSystemStorage } from './fs';
import { Waiters } from './waiters';

export type SingleInstanceStorageConfig = {
  basePath: string; // path to the directory where persistent values are stored
};

export class SingleInstanceStorage {
  private sessionValues = new Map<string, ValueInfo>();
  private fsStorage: FileSystemStorage;
  private waiters = new Waiters();

  constructor(config: SingleInstanceStorageConfig) {
    this.fsStorage = new FileSystemStorage(config.basePath);
  }

  async loadInfo({ key, sig, ttl }: { key: string; sig: string; ttl?: number }) {
    let valueInfo = this.sessionValues.get(key);

    if (valueInfo) {
      const signatureError = checkSignature(key, valueInfo.sig, sig);
      if (signatureError) throw new Error(signatureError);
    }

    if (!valueInfo) {
      valueInfo = ttl
        ? await this.loadPersistentValueInfo({ key, sig, ttl }) // prettier ignore
        : { key, state: 'missing', sig };

      // store value in memory for all usages in this session
      this.sessionValues.set(key, valueInfo);
    }

    return valueInfo;
  }

  private async loadPersistentValueInfo({
    key,
    sig,
    ttl,
  }: {
    key: string;
    sig: string;
    ttl: number;
  }) {
    const valueInfo: ValueInfo = { key, state: 'missing', persistent: true, sig };
    const storedInfo = await this.fsStorage.load(key);

    if (!storedInfo) return valueInfo;

    if (isExpired(storedInfo.computedAt, ttl)) {
      return assignValueInfo(valueInfo, { state: 'expired', prevValue: storedInfo.value });
    }

    const signatureError = checkSignature(key, storedInfo.sig, sig);
    if (signatureError) {
      return assignValueInfo(valueInfo, { state: 'sig-changed', prevValue: storedInfo.value });
    }

    return assignValueInfo(valueInfo, { state: 'computed', value: storedInfo.value });
  }

  async setComputing(valueInfo: ValueInfo) {
    assignValueInfo(valueInfo, { state: 'computing' });
    this.sessionValues.set(valueInfo.key, valueInfo);
  }

  async waitValue(key: string) {
    return this.waiters.wait(key);
  }

  // eslint-disable-next-line max-statements, visual/complexity
  async setComputed({ key, value, error }: { key: string; value?: unknown; error?: string }) {
    const valueInfo = this.sessionValues.get(key);

    if (!valueInfo) {
      throw new Error(`Cannot set value for key "${key}" that is not loaded.`);
    }
    if (valueInfo.state !== 'computing') {
      throw new Error(`Cannot set value for key "${key}" that is not in "computing" state.`);
    }

    if (error) {
      assignValueInfo(valueInfo, { state: 'missing', value: undefined });
      this.sessionValues.set(key, valueInfo);
      this.waiters.notifyError(key, error);
      if (valueInfo.persistent) await this.fsStorage.delete(key);
    } else {
      assignValueInfo(valueInfo, { state: 'computed', value });
      this.sessionValues.set(key, valueInfo);
      this.waiters.notifyComputed(valueInfo);
      if (valueInfo.persistent) await this.fsStorage.save(valueInfo);
    }

    return valueInfo;
  }

  async getLoadedInfo(key: string) {
    return this.sessionValues.get(key);
  }

  async getLoadedInfoList(prefix: string) {
    return [...this.sessionValues.values()].filter((valueInfo) => valueInfo.key.startsWith(prefix));
  }

  /**
   * Clears all session values.
   */
  async clearSession() {
    this.sessionValues.clear();
  }
}
