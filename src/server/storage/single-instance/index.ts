/**
 * Single-instance mode of Global Storage Server.
 * - non-persistent values are stored in memory
 * - presistent values are stored on fs and loaded to memory on the first request
 * - waiting for value is performed via memory
 */
import { checkSignature } from '../../../shared/sig';
import { isExpired } from '../../../shared/ttl';
import { updateValueInfo, initValueInfo, TestRunValueInfo } from '../../../shared/value-info';
import { FileSystemStorage } from './fs';
import { Waiters } from './waiters';

export type SingleInstanceStorageConfig = {
  runId: string;
  basePath: string; // path to the directory where persistent values are stored
};

export class SingleInstanceStorage {
  private values = new Map<string, TestRunValueInfo>();
  private fsStorage: FileSystemStorage;
  private waiters = new Waiters();

  constructor(config: SingleInstanceStorageConfig) {
    this.fsStorage = new FileSystemStorage(config.basePath);
  }

  // eslint-disable-next-line max-statements, visual/complexity
  async loadInfo(params: { key: string; sig: string; ttl?: number }): Promise<TestRunValueInfo> {
    const { key, sig, ttl } = params;
    let valueInfo = this.values.get(key);

    // check signature (for already accessed value)
    if (valueInfo) {
      const signatureError = checkSignature(key, valueInfo.sig, sig);
      if (signatureError) throw new Error(signatureError);
    }

    // load from fs (for persistent value that is not yet in memory)
    if (!valueInfo && ttl) {
      valueInfo = await this.loadPersistentValueInfo(key, sig);
    }

    // check expired
    if (valueInfo?.state === 'computed' && valueInfo.persistent && ttl && valueInfo.computedAt) {
      if (isExpired(valueInfo.computedAt, ttl)) {
        updateValueInfo(valueInfo, { state: 'expired', prevValue: valueInfo.value });
      }
    }

    if (!valueInfo) {
      valueInfo = initValueInfo(key, sig, ttl);
    }

    this.values.set(key, valueInfo);

    return valueInfo;
  }

  private async loadPersistentValueInfo(key: string, sig: string) {
    const storedInfo = await this.fsStorage.load(key);
    if (!storedInfo) return;

    const valueInfo: TestRunValueInfo = {
      key,
      state: 'computed',
      persistent: true,
      computedAt: storedInfo.computedAt,
      value: storedInfo.value,
      sig: storedInfo.sig,
    };

    const signatureError = checkSignature(key, valueInfo.sig, sig);
    if (signatureError) {
      updateValueInfo(valueInfo, { state: 'sig-changed', sig, prevValue: valueInfo.value });
    }

    return valueInfo;
  }

  async setComputing(valueInfo: TestRunValueInfo) {
    updateValueInfo(valueInfo, { state: 'computing' });
    this.values.set(valueInfo.key, valueInfo);
  }

  async waitValue(key: string) {
    return this.waiters.wait(key);
  }

  // eslint-disable-next-line max-statements, visual/complexity
  async setComputed({ key, value, error }: { key: string; value?: unknown; error?: string }) {
    const valueInfo = this.values.get(key);

    if (!valueInfo) {
      throw new Error(`Cannot set value for key "${key}" that is not loaded.`);
    }
    if (valueInfo.state !== 'computing') {
      throw new Error(`Cannot set value for key "${key}" that is not in "computing" state.`);
    }

    if (error) {
      updateValueInfo(valueInfo, { state: 'missing', value: undefined, computedAt: undefined });
      this.values.set(key, valueInfo);
      this.waiters.notifyError(key, error);
      if (valueInfo.persistent) await this.fsStorage.delete(key);
    } else {
      updateValueInfo(valueInfo, { state: 'computed', value, computedAt: Date.now() });
      this.values.set(key, valueInfo);
      this.waiters.notifyComputed(valueInfo);
      if (valueInfo.persistent) await this.fsStorage.save(valueInfo);
    }

    return valueInfo;
  }

  async getLoadedInfo(key: string) {
    return this.values.get(key);
  }

  async getLoadedInfoList(prefix: string) {
    return [...this.values.values()].filter((valueInfo) => valueInfo.key.startsWith(prefix));
  }

  /**
   * Clears all session values.
   */
  async clearSession() {
    this.values.clear();
  }
}
