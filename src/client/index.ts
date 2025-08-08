import { globalConfig, GlobalConfigInput } from '../config';
import { debug, debugKey } from '../utils/debug';
import { previewValue } from '../utils/value';
import { StorageApi } from './api';
import { DefaultSchema, GetArgs, Keys } from './types';

export type GlobalCacheConfig = GlobalConfigInput;

export class GlobalCache<S extends DefaultSchema = DefaultSchema> {
  #api?: StorageApi;

  /* Helper method to set global config via storage instance (for conveniency) */
  defineConfig(config: GlobalCacheConfig) {
    globalConfig.update(config);
  }

  get setup() {
    return require.resolve('../setup.js');
  }

  get teardown() {
    return require.resolve('../teardown.js');
  }

  private get api() {
    if (!this.#api) this.#api = new StorageApi(globalConfig.serverUrl);
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

    debugKey(key, `Fetching value...`);
    const { value: existingValue, missing } = await this.api.get({ key, ttl });
    if (!missing) {
      debugKey(key, `Cache hit: ${previewValue(existingValue)}`);
      return existingValue;
    }

    debugKey(key, 'Cache miss. Computing...');
    const { value, error } = await this.computeValue(fn);
    debugKey(key, error ? `Error: ${error.message}` : `Computed: ${previewValue(value)}`);

    debugKey(key, `Saving value...`);
    const savedValue = await this.api.set({ key, ttl, value, error });
    debugKey(key, `Saved.`);

    if (error) throw error;

    return savedValue;
  }

  /**
   * Fetch stale value.
   * - for non-persistant keys it would be the current value
   * - for persistent keys it would be the old value if it was changed during this run
   */
  async getStale<K extends Keys<S>>(key: K): Promise<S[K] | undefined> {
    debugKey(key, `Fetching stale value...`);
    const value = await this.api.getStale({ key });
    debugKey(key, `Fetched: ${previewValue(value)}`);
    return value;
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
    debug('Clearing session...');
    await this.api.clearSession();
    debug('Session cleared.');
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
