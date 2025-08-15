/**
 * Simple http client for json payloads.
 */

import { addSearchParams } from './http-query';

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
