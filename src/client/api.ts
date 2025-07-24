import { GetValueParams } from '../server/routes/get';
import { SetValueParams } from '../server/routes/set';
import { GetStaleParams } from '../server/routes/get-stale';
import { GetStaleListParams } from '../server/routes/get-stale-list';
import { TTL } from '../server/ttl';
import { HttpJson, prepareQueryParams, throwIfHttpError } from '../utils/http';
import { readValue } from '../utils/value';

export class StorageApi {
  private http: HttpJson;

  constructor(baseUrl: string) {
    this.http = new HttpJson(baseUrl);
  }

  async get({ key, ttl }: { key: string; ttl?: TTL }) {
    const params: GetValueParams = prepareQueryParams({ key, ttl });
    const res = await this.http.get('/get', params);
    if (res.status === 404) return { missing: true };
    await throwIfHttpError(res, `Failed to get key "${key}":`);
    const value = await readValue(res);

    return { value };
  }

  async set(params: { key: string; value: unknown; error?: Error; ttl?: TTL }) {
    const error = params.error ? params.error.message : undefined;
    const body: SetValueParams = { ...params, error };
    const res = await this.http.post('/set', body);
    await throwIfHttpError(res, `Failed to save key "${params.key}":`);
    const value = await readValue(res);

    return value;
  }

  async getStale({ key }: GetStaleParams) {
    const res = await this.http.get('/get-stale', { key });
    await throwIfHttpError(res, `Failed to get stale key "${key}":`);

    return readValue(res);
  }

  async getStaleList({ prefix }: GetStaleListParams) {
    const res = await this.http.get('/get-stale-list', { prefix });
    await throwIfHttpError(res, `Failed to get stale list for prefix "${prefix}":`);
    const value: unknown[] = await readValue(res);

    return value || [];
  }
}
