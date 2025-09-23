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

  // eslint-disable-next-line max-statements, visual/complexity
  async loadInfo({
    key,
    sig,
    ttl,
  }: {
    key: string;
    sig: string;
    ttl?: number;
  }): Promise<ValueInfo> {
    let valueInfo = this.sessionValues.get(key);

    let loadedFromFs = false;
    if (!valueInfo && ttl) {
      valueInfo = await this.loadPersistentValueInfo(key);
      loadedFromFs = true;
    }

    // check signature
    if (valueInfo?.state === 'computed') {
      const signatureError = checkSignature(key, valueInfo.sig, sig);
      if (signatureError) {
        // todo: replace with checking valueInfo.runId === currentRunId
        // eslint-disable-next-line max-depth
        if (loadedFromFs) {
          assignValueInfo(valueInfo, { state: 'sig-changed', prevValue: valueInfo.value });
        } else {
          throw new Error(signatureError);
        }
      }
    }

    // check expired
    if (valueInfo?.state === 'computed' && valueInfo.persistent && ttl && valueInfo.computedAt) {
      if (isExpired(valueInfo.computedAt, ttl)) {
        assignValueInfo(valueInfo, {
          state: 'expired',
          prevValue: valueInfo.value,
        });
      }
    }

    if (!valueInfo) {
      valueInfo = { key, state: 'missing', persistent: Boolean(ttl), sig };
    }

    // store value in memory for all usages in this session
    this.sessionValues.set(key, valueInfo);

    return valueInfo;
  }

  private async loadPersistentValueInfo(key: string): Promise<ValueInfo | undefined> {
    const storedInfo = await this.fsStorage.load(key);
    if (storedInfo) {
      return {
        key,
        state: 'computed',
        persistent: true,
        computedAt: storedInfo.computedAt,
        value: storedInfo.value,
        sig: storedInfo.sig,
      };
    }
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
      assignValueInfo(valueInfo, { state: 'computed', value, computedAt: Date.now() });
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
