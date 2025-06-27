import { globalConfig, GlobalConfigProvided } from './global-config';
import { type SetValueReqBody } from './server/routes/set';
import { TTL } from './server/ttl';
import { debug } from './utils';

export type KeyParams = {
  ttl?: TTL;
};

export type GetOrCallArgs<T> = [string, () => T] | [string, KeyParams, () => T];

export type GlobalStorageConfig = GlobalConfigProvided;

export class GlobalStorage {
  /**
   * Helper method to set global config on global storage instance.
   */
  defineConfig(config: GlobalStorageConfig) {
    globalConfig.update(config);
  }

  // eslint-disable-next-line visual/complexity, max-statements
  async getOrCall<T>(...args: GetOrCallArgs<T>): Promise<T> {
    const { key, params, fn } = resolveArgs(args);

    if (globalConfig.disabled) {
      debug(`"${key}": Global storage disabled. Computing...`);
      return fn();
    }

    // todo: check worker memory for faster access

    debug(`"${key}": Fetching value...`);
    const { value: existingValue, missing } = await this.fetchValue(key, params);
    debug(`"${key}": ${missing ? 'Missing. Computing...' : 'Value re-used.'}`);

    if (!missing) return existingValue;

    const { value, error } = await this.computeValue(fn);
    debug(`"${key}": ${error?.message || 'Computed.'}`);

    debug(`"${key}": Saving value...`);
    await this.storeValue({ key, params, value, error });
    debug(`"${key}": Saved.`);

    if (error) throw error;

    return value;
  }

  private async fetchValue(key: string, { ttl }: KeyParams) {
    const searchParams = new URLSearchParams();
    searchParams.set('compute', '1');
    if (ttl) searchParams.set('ttl', ttl);

    const url = `${buildKeyUrl(key)}?${searchParams}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // cache hit
    if (res.status === 200) {
      const value = await res.json();
      return { value };
    }

    // if not 404, something went wrong
    if (res.status !== 404) {
      throw new Error(
        `Failed to get key "${key}": ${res.status} ${res.statusText} ${await res.text()}`,
      );
    }

    return { missing: true };
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

  private async storeValue({
    key,
    params,
    value,
    error,
  }: {
    key: string;
    params: KeyParams;
    value: unknown;
    error: Error | undefined;
  }) {
    const url = buildKeyUrl(key);
    const reqBody: SetValueReqBody = {
      persist: Boolean(params.ttl),
      value,
      error: error ? error.stack : undefined,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reqBody),
    });

    if (!res.ok) {
      throw new Error(
        `Failed to save key "${key}": ${res.status} ${res.statusText} ${await res.text()}`,
      );
    }
  }

  // async get(key: string) {
  //   const res = await fetch(`${env.serverUrl}/get/${key}`);
  //   if (!res.ok) {
  //     throw new Error(`Failed to get key ${key}: ${res.statusText}`);
  //   }
  // }

  // async getAll({ prefix }: { prefix: string }) {
  //   const res = await fetch(`${env.serverUrl}/get-all/${prefix}`);
  //   if (!res.ok) {
  //     throw new Error(`Failed to get all values by prefix ${prefix}: ${res.statusText}`);
  //   }
  // }

  // todo: has
  // todo: delete
}

// export const GlobalStorage

function resolveArgs<T>(args: GetOrCallArgs<T>) {
  return args.length === 2
    ? { key: args[0], params: {}, fn: args[1] }
    : { key: args[0], params: args[1], fn: args[2] };
}

function buildKeyUrl(key: string) {
  const { namespace, runId, serverUrl } = globalConfig;
  const pathname = [namespace, runId, key].map(encodeURIComponent).join('/');
  return new URL(pathname, serverUrl).toString();
}
