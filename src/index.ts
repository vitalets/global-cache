import { env } from './env';
import { type GetValueParams } from './server/routes/get';
import { type SetValueParams } from './server/routes/set';
import { TTL } from './server/ttl';
import { debug, QueryParams } from './utils';
import { randomUUID } from 'node:crypto';

export type KeyParams = {
  key: string;
  ttl?: TTL;
};

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

    if (this.config.namespace) {
      env.namespace = this.config.namespace;
    }

    if (this.config.url) {
      env.serverUrl = this.config.url;
    }
  }

  // eslint-disable-next-line visual/complexity
  async getOrCall<T>(key: string | KeyParams, fn: () => T): Promise<T> {
    if (this.config.disabled) return fn();

    const keyParams: KeyParams = typeof key === 'string' ? { key } : key;

    // todo: check worker memory for faster access

    debug(`"${keyParams.key}": checking...`);
    const { value: existingValue, missing } = await this.fetchValue(keyParams);
    debug(`"${keyParams.key}": ${missing ? 'computing...' : 're-used.'}`);

    if (!missing) return existingValue;

    const { value, error } = await this.computeValue(fn);
    debug(`"${keyParams.key}": ${error?.message || 'computed.'}`);

    await this.storeValue(keyParams, value, error);
    debug(`"${keyParams.key}": saved.`);

    if (error) throw error;

    return value;
  }

  private async fetchValue({ key, ttl }: KeyParams) {
    const params: QueryParams<GetValueParams> = {
      namespace: env.namespace,
      runId: env.runId,
      compute: '1',
      ttl,
    };
    const searchParams = new URLSearchParams(params);
    const url = `${env.serverUrl}/get/${encodeURIComponent(key)}?${searchParams}`;
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

  private async storeValue({ key, ttl }: KeyParams, value: unknown, error: Error | undefined) {
    const reqBody: SetValueParams = {
      namespace: env.namespace,
      runId: env.runId,
      persist: Boolean(ttl),
      value,
      error: error ? error.stack : undefined,
    };

    const url = `${env.serverUrl}/set/${encodeURIComponent(key)}`;
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
