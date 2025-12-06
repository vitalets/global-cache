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
    // Re-enable debug to pick up any changes in DEBUG env variable (e.g. from Playwright config)
    // See: https://github.com/debug-js/debug/blob/master/src/common.js#L287
    if (process.env.DEBUG) Debug.enable(process.env.DEBUG);
    debug = Debug(key);
    cache.set(key, debug);
  }
  return debug;
}
