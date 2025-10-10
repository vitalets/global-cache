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
      valueInfo = await this.testRunStorage.wait(key);
      return valueInfo.state === 'computed'
        ? this.handleComputed(valueInfo)
        : this.handleError(valueInfo);
    }

    // load from persistent storage
    if (!valueInfo && ttl) {
      valueInfo = await this.persistentStorage.load(key);
      if (valueInfo) {
        const signatureMismatch = checkSignature(key, valueInfo.sig, sig);
        // eslint-disable-next-line max-depth
        if (signatureMismatch) {
          return this.handleSignatureChanged(valueInfo, sig, signatureMismatch);
        }
      }
    }

    // check expired
    if (valueInfo?.state === 'computed' && valueInfo.persistent && ttl) {
      if (isExpired(valueInfo.computedAt, ttl)) {
        return this.handleExpired(valueInfo, ttl);
      }
    }

    // normal cache hit
    if (valueInfo?.state === 'computed') {
      return this.handleComputed(valueInfo);
    }

    // no value
    if (!valueInfo) {
      return this.handleNoValue(key, sig, ttl);
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

  private async handleSignatureChanged(
    loadedValueInfo: TestRunValueInfo,
    newSig: string,
    { field }: SignatureMismatch,
  ): Promise<GetterCacheMiss> {
    await this.updateValueInfo(loadedValueInfo, {
      state: 'computing',
      sig: newSig,
      prevValue: loadedValueInfo.value,
      value: undefined,
      computedAt: undefined,
    });
    return { result: 'cache-miss', message: `signature changed: ${field}` };
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

  private async handleNoValue(key: string, sig: string, ttl?: number): Promise<GetterCacheMiss> {
    await this.updateValueInfo({ key, state: 'computing', sig, persistent: Boolean(ttl) });
    return { result: 'cache-miss', message: 'no cached value' };
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
