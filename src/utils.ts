import Debug from 'debug';

export const debug = Debug('global-storage');
export const debugForKey = (key: string) => Debug(`global-storage:${key}`);

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

export function previewValue(value: unknown) {
  try {
    if (value === undefined) return '<undefined>';
    const strValue = JSON.stringify(value);
    return strValue.length > 50 ? `${strValue.slice(0, 50)}...` : strValue;
  } catch {
    // Fallback for non-serializable values
    return `<non-serializable>`;
  }
}
