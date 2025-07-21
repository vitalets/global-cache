/**
 * Map of listeners for computed value.
 * Stores listeners for each key and notifies them when the value is computed or an error occurs.
 * This allows multiple requests to wait for the same computation without duplicating it.
 */

type Listener = {
  resolve: (value: unknown) => void;
  reject: (error: Error | string) => void;
};

export class ComputeListeners {
  private listeners = new Map<string, Listener[]>();

  wait(key: string) {
    return new Promise((resolve, reject) => {
      const listener: Listener = { resolve, reject };
      const listeners = this.listeners.get(key) || [];
      listeners.push(listener);
      this.listeners.set(key, listeners);
    });
  }

  notifyValue(key: string, value: unknown) {
    const listeners = this.listeners.get(key) || [];
    try {
      listeners.forEach(({ resolve }) => resolve(value));
    } finally {
      this.listeners.delete(key);
    }
  }

  notifyError(key: string, errorOrMessage: Error | string) {
    const listeners = this.listeners.get(key) || [];
    const error = errorOrMessage instanceof Error ? errorOrMessage : new Error(errorOrMessage);
    try {
      listeners.forEach(({ reject }) => reject(error));
    } finally {
      this.listeners.delete(key);
    }
  }
}

export const listeners = new ComputeListeners();
