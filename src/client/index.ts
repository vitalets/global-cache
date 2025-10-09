import { globalConfig, GlobalConfigInput } from '../config';
import { calcSignature } from '../shared/sig';
import { debug, debugKey } from '../shared/debug';
import { previewValue } from './utils/preview-value';
import { StorageApi } from './api';
import { DefaultSchema, GetArgs, Keys } from './types';
import { PlaywrightLikeConfig, wrapPlaywrightConfig } from '../playwright/config';
import { logger } from '../shared/logger';

export type GlobalCacheConfig = GlobalConfigInput;

export class GlobalCache<S extends DefaultSchema = DefaultSchema> {
  #api?: StorageApi;

  /*
   * Helper method to set global config via storage instance (for conveniency)
   */
  defineConfig(config: GlobalCacheConfig) {
    globalConfig.update(config);
  }

  /**
   * Playwright config wrapper.
   */
  playwright<T extends PlaywrightLikeConfig>(config: T) {
    return globalConfig.disabled ? config : wrapPlaywrightConfig(config);
  }

  get setup() {
    return require.resolve('../setup.js');
  }

  get teardown() {
    return require.resolve('../teardown.js');
  }

  get reporter() {
    return require.resolve('../playwright/reporter.js');
  }

  private get api() {
    if (!this.#api) {
      const { serverUrl, runId } = globalConfig;
      if (!serverUrl) {
        throw new Error('Global-cache url is empty. Did you run the global-cache setup?');
      }
      const baseUrl = new URL(`/run/${runId}/`, serverUrl).toString();
      this.#api = new StorageApi(baseUrl);
    }
    return this.#api;
  }

  /**
   * Get value by key or compute it if not found.
   */
  // eslint-disable-next-line visual/complexity, max-statements
  async get<K extends Keys<S>>(...args: GetArgs<K, S>): Promise<S[K]> {
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
  async getStale<K extends Keys<S>>(key: K) {
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

  async clear() {
    debug('Clearing test-run values...');
    await this.api.clear();
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

function resolveGetArgs<K extends Keys<S>, S extends DefaultSchema>(args: GetArgs<K, S>) {
  return args.length === 2
    ? { key: args[0], params: {}, fn: args[1] }
    : { key: args[0], params: { ...args[1] }, fn: args[2] };
}

// Export singleton
export const globalCache = new GlobalCache();
