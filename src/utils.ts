import Debug from 'debug';

export const debug = Debug('global-storage');

export type QueryParams<T> = {
  [K in keyof T]?: string;
};

export function stringifyValue(value: unknown): string {
  // undefined value is stored as empty string
  return value === undefined ? '' : JSON.stringify(value, null, 2);
}

export function parseValue(content: string) {
  return content ? JSON.parse(content) : undefined;
}
