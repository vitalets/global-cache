import { GetValueParams } from '../server/routes/get';
import { SetValueParams } from '../server/routes/set';
import { GetStaleParams } from '../server/routes/get-stale';
import { GetStaleListParams } from '../server/routes/get-stale-list';
import { TTL } from '../shared/ttl';
import { buildHttpError, HttpJson, prepareQueryParams, throwIfHttpError } from './utils/http-json';
import { getStaleValue, ValueInfo } from '../shared/value-info';

export class StorageApi {
  private http: HttpJson;

  constructor(baseUrl: string) {
    this.http = new HttpJson(baseUrl);
  }

  async get({ key, sig, ttl }: { key: string; sig: string; ttl?: TTL }) {
    const params: GetValueParams = prepareQueryParams({ key, sig, ttl });
    const res = await this.http.get('/get', params);

    if (res.status !== 200 && res.status !== 404) {
      throw await buildHttpError(res, `Failed to get key "${key}":`);
    }

    return (await res.json()) as ValueInfo;
  }

  async set({ key, value, error }: { key: string; value: unknown; error?: Error }) {
    const body: SetValueParams = { key, value, error: error?.message };
    const res = await this.http.post('/set', body);
    await throwIfHttpError(res, `Failed to save key "${key}":`);

    return (await res.json()) as ValueInfo;
  }

  async getStale({ key }: GetStaleParams) {
    const res = await this.http.get('/get-stale', { key });
    await throwIfHttpError(res, `Failed to get stale key "${key}":`);
    const valueInfo = (await res.json()) as ValueInfo | null;

    return getStaleValue(valueInfo);
  }

  async getStaleList({ prefix }: GetStaleListParams) {
    const res = await this.http.get('/get-stale-list', { prefix });
    await throwIfHttpError(res, `Failed to get stale list for prefix "${prefix}":`);
    const valueInfoList = (await res.json()) as ValueInfo[];

    return valueInfoList.map((valueInfo) => getStaleValue(valueInfo));
  }

  async clearSession() {
    const res = await this.http.post('/clear-session');
    await throwIfHttpError(res, 'Failed to clear session:');
  }
}
