import { globalConfig, GlobalConfigInput } from '../global-config';
import { TTL } from '../server/ttl';
import { debug } from '../utils';
import { ValueFetcher } from './value-fetcher';

export type KeyParams = {
  ttl?: TTL;
};

export type GetOrComputeArgs<T> = [string, () => T] | [string, KeyParams, () => T];

export type GlobalStorageConfig = GlobalConfigInput;

export class GlobalStorage {
  /**
   * Set global config via global storage instance (for conveniency).
   */
  defineConfig(config: GlobalStorageConfig) {
    globalConfig.update(config);
  }

  get setup() {
    return require.resolve('../setup.js');
  }

  get teardown() {
    return require.resolve('../teardown.js');
  }

  // eslint-disable-next-line visual/complexity, max-statements
  async getOrCompute<T>(...args: GetOrComputeArgs<T>): Promise<T> {
    const { key, params, fn } = resolveGetOrComputeArgs(args);

    if (globalConfig.disabled) {
      debug(`"${key}": Global storage disabled. Computing...`);
      return fn();
    }

    const valueFetcher = new ValueFetcher(key, params);
    debug(`"${key}": Fetching value...`);
    const { value: existingValue, missing } = await valueFetcher.load();
    debug(`"${key}": ${missing ? 'Missing. Computing...' : 'Value re-used.'}`);

    if (!missing) return existingValue as T;

    const { value, error } = await this.computeValue(fn);
    debug(`"${key}": ${error?.message || 'Computed.'}`);

    debug(`"${key}": Saving value...`);
    await valueFetcher.save({ value, error });
    debug(`"${key}": Saved.`);

    if (error) throw error;

    return value;
  }

  private async computeValue<T>(fn: () => T) {
    try {
      const value = await fn();
      return { value };
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      return { error };
    }
  }

  /**
   * Fetch stale value.
   * - for non-persistant keys it would be current value in memory
   * - for persistent keys it would be the old value if it was changed during this run
   */
  async getStale(key: string) {
    debug(`"${key}": Fetching stale value...`);
    const value = await new ValueFetcher(key).getStale();
    debug(`"${key}": Fetched.`);
    return value;
  }

  // async getAll({ prefix }: { prefix: string }) {
  //   const res = await fetch(`${env.serverUrl}/get-all/${prefix}`);
  //   if (!res.ok) {
  //     throw new Error(`Failed to get all values by prefix ${prefix}: ${res.statusText}`);
  //   }
  // }

  // todo: has
  // todo: delete
}

function resolveGetOrComputeArgs<T>(args: GetOrComputeArgs<T>) {
  return args.length === 2
    ? { key: args[0], params: {}, fn: args[1] }
    : { key: args[0], params: args[1], fn: args[2] };
}

// Global storage instance.
export const globalStorage = new GlobalStorage();
