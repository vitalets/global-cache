/**
 * Map of listeners for computed value.
 * Stores listeners for each key and notifies them when the value is computed or an error occurs.
 * This allows multiple requests to wait for the same computation without duplicating it.
 */

type ValueListener = {
  resolve: (value: unknown) => void;
  reject: (errorMessage: string) => void;
};

export class ValueListeners {
  private listeners = new Map<string, ValueListener[]>();

  wait(key: string) {
    return new Promise((resolve, reject) => {
      const listener: ValueListener = { resolve, reject };
      const listeners = this.listeners.get(key) || [];
      listeners.push(listener);
      this.listeners.set(key, listeners);
    });
  }

  notifyValue(key: string, value: unknown) {
    const listeners = this.listeners.get(key);
    try {
      listeners?.forEach(({ resolve }) => resolve(value));
    } finally {
      this.listeners.delete(key);
    }
  }

  notifyError(key: string, errorMessage: string) {
    const listeners = this.listeners.get(key);
    try {
      listeners?.forEach(({ reject }) => reject(errorMessage));
    } finally {
      this.listeners.delete(key);
    }
  }
}

export const listeners = new ValueListeners();
