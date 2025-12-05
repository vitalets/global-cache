/**
 * Utility functions for working with HTTP query parameters.
 */

export type QueryParams<T extends Record<string, unknown>> = {
  [K in keyof T]: string;
};

/**
 * Adds query parameters to the given URL.
 */
export function addSearchParams(url: URL, query?: Record<string, string>) {
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
