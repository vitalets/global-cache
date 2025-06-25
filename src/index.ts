import { env } from './env';
import { type GetValueQuery } from './server/routes/get';
import { type SetValueParams } from './server/routes/set';
import { TTL } from './server/ttl';
import { debug, QueryParams } from './utils';
import { randomUUID } from 'node:crypto';

export type KeyParams = {
  ttl?: TTL;
};

export type GetOrCallArgs<T> = [string, () => T] | [string, KeyParams, () => T];

export type GlobalStorageConfig = {
  namespace?: string;
  runId?: string;
  disabled?: boolean;
  url?: string;
  baseDir?: string; // where to store files, ignored if url is set
};

export class GlobalStorage {
  protected config: GlobalStorageConfig = {};

  // eslint-disable-next-line visual/complexity
  defineConfig(config: GlobalStorageConfig) {
    this.config = config;
    if (this.config.disabled) return;

    if (!env.runId) {
      env.runId = this.config.runId || randomUUID();
    }

    env.namespace = this.config.namespace || 'default';

    if (this.config.url) {
      env.serverUrl = this.config.url;
    }
  }

  // eslint-disable-next-line visual/complexity, max-statements
  async getOrCall<T>(...args: GetOrCallArgs<T>): Promise<T> {
    const { key, params, fn } = resolveArgs(args);

    if (this.config.disabled) {
      debug(`"${key}": Storage disabled. Computing...`);
      return fn();
    }

    // todo: check worker memory for faster access

    debug(`"${key}": Accessing...`);
    const { value: existingValue, missing } = await this.fetchValue(key, params);
    debug(`"${key}": ${missing ? 'Missing. Computing...' : 'Value re-used.'}`);

    if (!missing) return existingValue;

    const { value, error } = await this.computeValue(fn);
    debug(`"${key}": ${error?.message || 'Computed.'}`);

    await this.storeValue({ key, params, value, error });
    debug(`"${key}": Saved.`);

    if (error) throw error;

    return value;
  }

  private async fetchValue(key: string, { ttl }: KeyParams) {
    const params: QueryParams<GetValueQuery> = { compute: '1', ttl };
    const searchParams = new URLSearchParams(params);
    const url = `${buildKeyUrl(key)}?${searchParams}`;
    const res = await fetch(url, {
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
    const reqBody: SetValueParams = {
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

function resolveArgs<T>(args: GetOrCallArgs<T>) {
  return args.length === 2
    ? { key: args[0], params: {}, fn: args[1] }
    : { key: args[0], params: args[1], fn: args[2] };
}

function buildKeyUrl(key: string) {
  const pathname = [env.namespace, env.runId, key].map(encodeURIComponent).join('/');
  return `${env.serverUrl}/${pathname}`;
}
