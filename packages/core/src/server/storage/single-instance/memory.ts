import { TestRunValueInfo } from '../../../shared/value-info';
import { ITestRunStorage } from '../types';

type Listener = (valueInfo: TestRunValueInfo) => void;

export class MemoryStorage implements ITestRunStorage {
  private values = new Map<string, TestRunValueInfo>();
  private listeners = new Map<string /* key */, Listener[]>();

  async load(key: string) {
    return this.values.get(key);
  }

  async loadByPrefix(prefix: string) {
    return [...this.values.values()].filter((valueInfo) => valueInfo.key.startsWith(prefix));
  }

  async save(valueInfo: TestRunValueInfo, { notify = false } = {}) {
    this.values.set(valueInfo.key, valueInfo);
    if (notify) this.notify(valueInfo);
  }

  async clear() {
    this.values.clear();
  }

  /**
   * Atomically claims the key for computing if it is not yet present.
   *
   * Concurrent workers all call `await testRunStorage.load(key)`, which yields the event loop,
   * so all of them can see `undefined` simultaneously. Using async `save()` for the initial
   * write would let every worker return `cache-miss`, compute in parallel, and collide in
   * `setter.set()` — which only accepts a single `'computing'` caller.
   *
   * Because this method has no `await`, Node.js's single-threaded event loop makes
   * `Map.has()` + `Map.set()` atomic. Only the first caller gets `true` (proceeds to compute);
   * all subsequent callers get `false` (and wait).
   */
  claimForComputing(valueInfo: TestRunValueInfo): boolean {
    if (this.values.has(valueInfo.key)) return false;
    this.values.set(valueInfo.key, valueInfo);
    return true;
  }

  async waitForComputed(key: string): Promise<TestRunValueInfo> {
    // Guard: if notify already fired before we registered, return immediately.
    const existing = this.values.get(key);
    if (existing && existing.state !== 'computing') return existing;

    return new Promise<TestRunValueInfo>((resolve) => {
      const listeners = this.listeners.get(key) || [];
      listeners.push(resolve);
      this.listeners.set(key, listeners);
    });
  }

  private notify(valueInfo: TestRunValueInfo) {
    const listeners = this.listeners.get(valueInfo.key);
    try {
      listeners?.forEach((resolve) => resolve(valueInfo));
    } finally {
      this.listeners.delete(valueInfo.key);
    }
  }
}
