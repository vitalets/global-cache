import { globalConfig, GlobalCacheConfig } from '../config';
import { debug, debugKey } from '../shared/debug';
import { logger } from '../shared/logger';
import { calcSignature } from '../shared/sig';
import { StorageApi } from './api';
import { DefaultKeysSchema, GetArgs, StringKeys } from './types';
import { previewValue } from './utils/preview-value';

export { DefaultKeysSchema };

export class GlobalCacheClient<S extends DefaultKeysSchema = DefaultKeysSchema> {
  #api?: StorageApi;

  /*
   * Helper method to set global config via storage instance (for conveniency)
   */
  config(config: GlobalCacheConfig) {
    globalConfig.update(config);
  }

  private get api() {
    if (!this.#api) {
      const { serverUrl, runId } = globalConfig;
      this.#api = new StorageApi(serverUrl, runId);
    }
    return this.#api;
  }

  /**
   * Get value by key or compute it if not found.
   */
  // eslint-disable-next-line visual/complexity, max-statements
  async get<K extends StringKeys<S>>(...args: GetArgs<K, S>): Promise<S[K]> {
    const { key, params, fn } = resolveGetArgs(args);

    if (globalConfig.disabled) {
      debugKey(key, `Global cache disabled. Computing...`);
      return fn();
    }

    const ttl = globalConfig.ignoreTTL ? undefined : params.ttl;

    // keep stack expression in this fn to have correct stack offset
    const stack = new Error().stack?.split('\n')[2]?.trim().replace(process.cwd(), '') || '';
    const sig = calcSignature({ fn, ttl, stack });

    debugKey(key, `Fetching value...`);
    const body = await this.api.get({ key, sig, ttl });

    if (body.result === 'cache-hit') {
      const { value } = body.valueInfo;
      debugKey(key, `${body.result}: ${previewValue(value)}`);
      return value as S[K];
    }

    if (body.result === 'error') {
      throw new Error(body.message);
    }

    if (body.result === 'sig-mismatch') {
      logger.warn(body.message);
      debugKey(key, `${body.result}, computing...`);
    } else {
      debugKey(key, `${body.result} (${body.message}), computing...`);
    }

    const { value, error } = await this.computeValue(fn);
    debugKey(key, error ? `Error: ${error.message}` : `Computed: ${previewValue(value)}`);

    if (body.result === 'sig-mismatch') {
      debugKey(key, `Not saving value because of signature mismatch.`);
      if (error) throw error;
      return value;
    }

    debugKey(key, `Saving value...`);
    const valueInfo = await this.api.set({ key, value, error });
    debugKey(key, `Saved.`);

    if (error) throw error;

    // We return 'valueInfo.value' instead of 'value' to have exact the same value
    // as stored (in case of serialization changes).
    return valueInfo.value as S[K];
  }

  /**
   * Fetch stale value.
   * - for non-persistant keys it would be the current value
   * - for persistent keys it would be the old value if it was changed during this run
   */
  async getStale<K extends StringKeys<S>>(key: K) {
    debugKey(key, `Fetching stale value...`);
    const value = await this.api.getStale({ key });
    debugKey(key, `Fetched: ${previewValue(value)}`);

    return value as S[K] | undefined;
  }

  /**
   * Fetch list of stale values by prefix.
   * - for non-persistant keys it would be the current value
   * - for persistent keys it would be the old value if it was changed during this run
   */
  async getStaleList<ValueType>(prefix: string) {
    debugKey(prefix, `Fetching stale list...`);
    const values = await this.api.getStaleList({ prefix });
    debugKey(prefix, `Fetched: ${values.length} value(s)`);

    return values as ValueType[];
  }

  async clearTestRun() {
    debug(`Clearing test-run: ${globalConfig.runId}`);
    await this.api.clearTestRun();
    debug('Cleared.');
  }

  private async computeValue<ValueType>(fn: () => ValueType) {
    try {
      const value = await fn();
      return { value };
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      return { error };
    }
  }
}

function resolveGetArgs<K extends StringKeys<S>, S extends DefaultKeysSchema>(args: GetArgs<K, S>) {
  return args.length === 2
    ? { key: args[0], params: {}, fn: args[1] }
    : { key: args[0], params: { ...args[1] }, fn: args[2] };
}
