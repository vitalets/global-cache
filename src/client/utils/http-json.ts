/**
 * Simple http client for json payloads.
 */

const headers = { 'Content-Type': 'application/json' };

export type QueryParams<T extends Record<string, unknown>> = {
  [K in keyof T]: string;
};

export class HttpJson {
  constructor(private baseUrl: string) {}

  async get(pathname: string, query?: Record<string, string>) {
    const url = this.buildUrl(pathname, query);
    return fetch(url, { method: 'GET', headers });
  }

  async post(pathname: string, bodyObj?: Record<string, unknown>) {
    const url = this.buildUrl(pathname);
    const body = bodyObj ? JSON.stringify(bodyObj) : undefined;
    return fetch(url, { method: 'POST', headers, body });
  }

  buildUrl(pathname: string, query?: Record<string, string>) {
    const url = new URL(pathname, this.baseUrl);
    addSearchParams(url, query);
    return url.toString();
  }
}

export async function buildHttpError(res: Response, prefix: string) {
  return new Error(`${prefix} ${res.status} ${res.statusText} ${await res.text()}`);
}

export async function throwIfHttpError(res: Response, message: string) {
  if (!res.ok) throw await buildHttpError(res, message);
}

function addSearchParams(url: URL, query?: Record<string, string>) {
  const preparedQuery = prepareQueryParams(query || {});
  Object.entries(preparedQuery).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });
}

/**
 * Converts record of parameters to query string format.
 * - undefined values are ignored
 * - values are converted to strings
 */
export function prepareQueryParams<T extends Record<string, unknown>>(params?: T): QueryParams<T> {
  const query: QueryParams<T> = {} as QueryParams<T>;
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined) {
      query[key as keyof T] = String(value);
    }
  });

  return query;
}
