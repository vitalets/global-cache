import { globalConfig, GlobalConfigInput } from './global-config';
import { type SetValueReqBody } from './server/routes/set';
import { TTL } from './server/ttl';
import { debug } from './utils';

export type KeyParams = {
  ttl?: TTL;
};

export type GetOrCallArgs<T> = [string, () => T] | [string, KeyParams, () => T];

export type GlobalStorageConfig = GlobalConfigInput;

export class GlobalStorage {
  /**
   * Set global config via global storage instance (for conveniency).
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

  /**
   * Clears memory srorage for current runId
   */
  async clearMemory() {
    const { namespace, runId, serverUrl } = globalConfig;
    const pathname = [namespace, runId].map(encodeURIComponent).join('/');
    const url = new URL(pathname, serverUrl).toString();
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) {
      throw new Error(
        `Failed to clear memory for runId "${runId}": ${res.status} ${res.statusText} ${await res.text()}`,
      );
    }
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
      const text = await res.text();
      const value = text ? JSON.parse(text) : undefined;
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

  /**
   * Fetch value without computing.
   * What about persistence?
   */
  async get(key: string) {
    const url = buildKeyUrl(key);
    const res = await fetch(url);

    if (res.status === 404) return;

    if (!res.ok) {
      throw new Error(
        `Failed to get key "${key}": ${res.status} ${res.statusText} ${await res.text()}`,
      );
    }

    const text = await res.text();
    return text ? JSON.parse(text) : undefined;
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

export const globalStorage = new GlobalStorage();
