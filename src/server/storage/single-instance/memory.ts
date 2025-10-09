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

  async wait(key: string) {
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
