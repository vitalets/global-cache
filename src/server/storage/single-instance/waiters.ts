/**
 * Map of listeners for computed value.
 * Stores listeners for each key and notifies them when the value is computed or an error occurs.
 * This allows multiple requests to wait for the same computation without duplicating it.
 */

import { ValueInfo } from '../../../shared/value-info';

type Waiter = {
  resolve: (valueInfo: ValueInfo) => void;
  reject: (errorMessage: string) => void;
};

export class Waiters {
  private map = new Map<string, Waiter[]>();

  wait(key: string) {
    return new Promise<ValueInfo>((resolve, reject) => {
      const waiter: Waiter = { resolve, reject };
      const waiters = this.map.get(key) || [];
      waiters.push(waiter);
      this.map.set(key, waiters);
    });
  }

  notifyComputed(valueInfo: ValueInfo) {
    const waiters = this.map.get(valueInfo.key);
    try {
      waiters?.forEach(({ resolve }) => resolve(valueInfo));
    } finally {
      this.map.delete(valueInfo.key);
    }
  }

  notifyError(key: string, errorMessage: string) {
    const waiters = this.map.get(key);
    try {
      waiters?.forEach(({ reject }) => reject(errorMessage));
    } finally {
      this.map.delete(key);
    }
  }
}
