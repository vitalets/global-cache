/**
 * Server's memory store.
 */
import { debug } from '../../utils';

export type ValueInfo = {
  key: string;
  pending?: boolean;
  value?: unknown;
  updatedAt?: number;
  listeners?: Listener[];
};

export type Listener = {
  resolve: (value: unknown) => void;
  reject: (error: Error | string) => void;
};

const memoryStores = new Map<string | undefined, MemoryStore>();

export function getMemoryStore(namespace: string | undefined, runId: string) {
  const storeKey = `${namespace}-${runId}`;
  if (!memoryStores.has(storeKey)) {
    memoryStores.set(storeKey, new MemoryStore());
  }
  return memoryStores.get(storeKey)!;
}

class MemoryStore {
  private map = new Map<string, ValueInfo>();

  get(key: string) {
    return this.map.get(key);
  }

  set(key: string, value: unknown) {
    const valueInfo = this.map.get(key);

    if (!valueInfo?.pending) {
      debug(
        `Setting value for key "${key}" that is not in pending state. This might indicate an issue.`,
      );
    }

    this.map.set(key, { key, value, updatedAt: Date.now() });

    valueInfo?.listeners?.forEach(({ resolve }) => resolve(value));
  }

  setError(key: string, error: string) {
    const valueInfo = this.map.get(key);

    if (!valueInfo?.pending) {
      debug(
        `Setting value for key "${key}" that is not in pending state. This might indicate an issue.`,
      );
    }

    this.delete(key);

    valueInfo?.listeners?.forEach(({ reject }) => reject(error));
  }

  delete(key: string) {
    this.map.delete(key);
  }
}
