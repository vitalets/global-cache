/**
 * Handles "get" request for single-instance storage.
 */
import { checkSignature, SignatureMismatch } from '../shared/sig';
import { isExpired } from '../shared/ttl';
import { TestRunValueInfo } from '../shared/value-info';
import { IPersistentStorage, ITestRunStorage } from './storage/types';

type GetterCacheMiss = { result: 'cache-miss'; message: string };
type GetterCacheHit = { result: 'cache-hit'; valueInfo: TestRunValueInfo };
type GetterError = { result: 'error'; message: string };
type GetterSingatureMismatch = { result: 'sig-mismatch'; message: string };

export type GetterResult = GetterCacheMiss | GetterCacheHit | GetterError | GetterSingatureMismatch;

export class Getter {
  constructor(
    private testRunStorage: ITestRunStorage,
    private persistentStorage: IPersistentStorage,
  ) {}

  // eslint-disable-next-line visual/complexity, max-statements
  async get(key: string, sig: string, ttl?: number): Promise<GetterResult> {
    let valueInfo = await this.testRunStorage.load(key);

    // check signature (for already accessed value)
    if (valueInfo) {
      const signatureMismatch = checkSignature(key, valueInfo.sig, sig);
      if (signatureMismatch) {
        return this.handleSignatureMismatch(key, signatureMismatch);
      }
    }

    // wait if computing
    if (valueInfo?.state === 'computing') {
      valueInfo = await this.testRunStorage.waitForComputed(key);
      return valueInfo.state === 'computed'
        ? this.handleComputed(valueInfo)
        : this.handleError(valueInfo);
    }

    // no value in memory -- claim the key atomically before touching persistent storage,
    // so concurrent callers for the same key can't all decide to recompute independently
    if (!valueInfo) {
      return this.handleNoValue(key, sig, ttl);
    }

    // check expired
    if (valueInfo.state === 'computed' && valueInfo.persistent && ttl) {
      if (isExpired(valueInfo.computedAt, ttl)) {
        return this.handleExpired(valueInfo, ttl);
      }
    }

    // normal cache hit
    if (valueInfo.state === 'computed') {
      return this.handleComputed(valueInfo);
    }

    return this.handleDefault(valueInfo);
  }

  private handleSignatureMismatch(
    key: string,
    signatureMismatch: SignatureMismatch,
  ): GetterSingatureMismatch {
    return { result: 'sig-mismatch', message: buildSignatureError(key, signatureMismatch) };
  }

  private handleComputed(valueInfo: TestRunValueInfo): GetterCacheHit {
    return { result: 'cache-hit', valueInfo };
  }

  private handleError(valueInfo: TestRunValueInfo): GetterError {
    return { result: 'error', message: valueInfo.errorMessage || 'Unknown error' };
  }

  private async handleExpired(valueInfo: TestRunValueInfo, ttl: number): Promise<GetterCacheMiss> {
    await this.updateValueInfo(valueInfo, {
      state: 'computing',
      prevValue: valueInfo.value,
      value: undefined,
      computedAt: undefined,
    });
    return { result: 'cache-miss', message: `expired: ${ttl}` };
  }

  // eslint-disable-next-line visual/complexity, max-statements
  private async handleNoValue(key: string, sig: string, ttl?: number): Promise<GetterResult> {
    const placeholder: TestRunValueInfo = {
      key,
      state: 'computing',
      sig,
      persistent: Boolean(ttl),
    };
    const claimed = this.testRunStorage.claimForComputing(placeholder);
    if (!claimed) {
      const resolved = await this.testRunStorage.waitForComputed(key);
      return resolved.state === 'computed'
        ? this.handleComputed(resolved)
        : this.handleError(resolved);
    }

    if (!ttl) return { result: 'cache-miss', message: 'no cached value' };

    // We own the 'computing' slot now, so no other concurrent caller can also decide
    // to recompute this key while we consult persistent storage.
    const persisted = await this.persistentStorage.load(key);
    if (!persisted) return { result: 'cache-miss', message: 'no cached value' };

    const signatureMismatch = checkSignature(key, persisted.sig, sig);
    if (signatureMismatch) {
      placeholder.prevValue = persisted.value;
      return { result: 'cache-miss', message: `signature changed: ${signatureMismatch.field}` };
    }

    if (isExpired(persisted.computedAt, ttl)) {
      placeholder.prevValue = persisted.value;
      return { result: 'cache-miss', message: `expired: ${ttl}` };
    }

    // Persistent value is fresh and valid -- adopt it as computed, update the map entry
    // (already resident via claimForComputing) and notify any waiters.
    Object.assign(placeholder, persisted);
    await this.testRunStorage.save(placeholder, { notify: true });
    return this.handleComputed(placeholder);
  }

  private async handleDefault(valueInfo: TestRunValueInfo): Promise<GetterCacheMiss> {
    const message = `old state: ${valueInfo.state}`;
    await this.updateValueInfo(valueInfo, { state: 'computing' });
    return { result: 'cache-miss', message };
  }

  private async updateValueInfo(valueInfo: TestRunValueInfo, props?: Partial<TestRunValueInfo>) {
    Object.assign(valueInfo, props);
    await this.testRunStorage.save(valueInfo);
  }
}

function buildSignatureError(key: string, { field, value1, value2 }: SignatureMismatch) {
  return [
    `Signature mismatch (${field}). `,
    `Please ensure you don't call globalCache.get("${key}") from multiple places.\n`,
    `1-st call ${field}: ${value1}\n`,
    `2-nd call ${field}: ${value2}`,
  ].join('');
}
