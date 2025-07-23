// todo

import { globalConfig } from '../global-config';
import { SetValueReqBody } from '../server/routes/set';
import { TTL } from '../server/ttl';
import { parseValue } from '../utils';

export type KeyParams = {
  ttl?: TTL;
};

const headers = {
  'Content-Type': 'application/json',
};

export class ValueFetcher {
  url: string;

  constructor(
    private key: string,
    private params: KeyParams = {},
  ) {
    this.url = this.buildUrl();
  }

  async load() {
    const url = this.buildLoadUrl();
    const res = await fetch(url, {
      method: 'GET',
      headers,
    });

    // cache hit
    if (res.status === 200) {
      const text = await res.text();
      const value = parseValue(text);
      return { value };
    }

    // if not 404, something went wrong
    if (res.status !== 404) {
      throw await this.buildNetworkError(res, `Failed to get key "${this.key}":`);
    }

    return { missing: true };
  }

  async save({ value, error }: { value: unknown; error: Error | undefined }) {
    const reqBody: SetValueReqBody = {
      ttl: this.params.ttl,
      value,
      error: error ? error.message : undefined,
    };

    const res = await fetch(this.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(reqBody),
    });

    if (!res.ok) {
      throw await this.buildNetworkError(res, `Failed to save key "${this.key}":`);
    }
  }

  async getStale() {
    const url = `${this.url}/stale`;
    const res = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (res.ok) {
      const text = await res.text();
      return parseValue(text);
    } else {
      throw await this.buildNetworkError(res, `Failed to get stale key "${this.key}":`);
    }
  }

  private buildLoadUrl() {
    const urlObj = new URL(this.url);
    urlObj.searchParams.set('compute', '1');
    const { ttl } = this.params;
    if (ttl) urlObj.searchParams.set('ttl', String(ttl));

    return urlObj.toString();
  }

  private buildUrl() {
    const { serverUrl } = globalConfig;
    const pathname = encodeURIComponent(this.key);
    return new URL(pathname, serverUrl).toString();
  }

  private async buildNetworkError(res: Response, prefix: string) {
    return new Error(`${prefix} ${res.status} ${res.statusText} ${await res.text()}`);
  }
}
