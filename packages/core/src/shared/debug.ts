/**
 * Debugging.
 * Use lazy debug initialization to pick env variables from runtime (e.g. Playwright config).
 */
import Debug from 'debug';

const cache = new Map<string, Debug.Debugger>();

export function debug(...args: Parameters<Debug.Debugger>) {
  getDebug('global-cache')(...args);
}

export const debugKey = (key: string, message: string) => {
  getDebug(`global-cache:${key}`)(message);
};

function getDebug(key: string) {
  let debug = cache.get(key);
  if (!debug) {
    debug = Debug(key);
    cache.set(key, debug);
  }
  return debug;
}
