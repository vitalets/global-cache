import { GetValueParams, GetValueResponse } from '../server/routes/get';
import { SetValueParams, SetValueResponse } from '../server/routes/set';
import { GetStaleParams, SetStaleResponse } from '../server/routes/get-stale';
import { GetStaleListParams, SetStaleListResponse } from '../server/routes/get-stale-list';
import { TTL } from '../shared/ttl';
import { HttpJson } from './utils/http-json';
import { prepareQueryParams } from './utils/http-query';
import { throwIfHttpError } from './utils/http-error';
import { getStaleValue } from '../shared/value-info';

export class StorageApi {
  private http: HttpJson;

  constructor(baseUrl: string) {
    this.http = new HttpJson(baseUrl);
  }

  async get({ key, sig, ttl }: { key: string; sig: string; ttl?: TTL }) {
    const params: GetValueParams = prepareQueryParams({ key, sig, ttl });
    const res = await this.http.get('get', params);
    await throwIfHttpError(res, `Failed to get key "${key}":`);
    return (await res.json()) as GetValueResponse;
  }

  async set({ key, value, error }: { key: string; value: unknown; error?: Error }) {
    const body: SetValueParams = { key, value, error: error?.message };
    const res = await this.http.post('set', body);
    await throwIfHttpError(res, `Failed to save key "${key}":`);
    return (await res.json()) as SetValueResponse;
  }

  async getStale({ key }: GetStaleParams) {
    const res = await this.http.get('get-stale', { key });
    await throwIfHttpError(res, `Failed to get stale key "${key}":`);
    const valueInfo = (await res.json()) as SetStaleResponse;
    return getStaleValue(valueInfo);
  }

  async getStaleList({ prefix }: GetStaleListParams) {
    const res = await this.http.get('get-stale-list', { prefix });
    await throwIfHttpError(res, `Failed to get stale list for prefix "${prefix}":`);
    const valueInfoList = (await res.json()) as SetStaleListResponse;
    return valueInfoList.map((valueInfo) => getStaleValue(valueInfo));
  }

  async clear() {
    const res = await this.http.post('clear');
    await throwIfHttpError(res, 'Failed to clear session:');
  }
}
