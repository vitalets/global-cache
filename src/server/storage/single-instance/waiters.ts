/**
 * Map of listeners for computed value.
 * Stores listeners for each key and notifies them when the value is computed or an error occurs.
 * This allows multiple requests to wait for the same computation without duplicating it.
 */

type Waiter = {
  resolve: (value: unknown) => void;
  reject: (errorMessage: string) => void;
};

export class Waiters {
  private map = new Map<string, Waiter[]>();

  wait(key: string) {
    return new Promise((resolve, reject) => {
      const waiter: Waiter = { resolve, reject };
      const waiters = this.map.get(key) || [];
      waiters.push(waiter);
      this.map.set(key, waiters);
    });
  }

  notifyValue(key: string, value: unknown) {
    const waiters = this.map.get(key);
    try {
      waiters?.forEach(({ resolve }) => resolve(value));
    } finally {
      this.map.delete(key);
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
