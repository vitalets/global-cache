/**
 * A workaround to reliably work in Playwright UI mode and VSCode extension.
 *
 * The problem: in these modes test run is a long-running process,
 * that by default executes global setup only once:
 * See: https://github.com/microsoft/playwright/issues/33193
 * See: https://github.com/microsoft/playwright/issues/37524
 *
 * On subsequent runs of individual tests, the cached value is re-used,
 * but the code may be changed -> signature mismatch.
 *
 * The solution is to use a reporter to clear the current run cache.
 * Reporter's onEnd is called on every test execution.
 *
 * TODO: handle external server.
 */
import { storageServer } from './server';
import { globalCache } from './client';

export default class GlobalCacheReporter {
  printsToStdio() {
    return false;
  }

  async onEnd() {
    if (storageServer.isRunning) {
      await globalCache.clearSession();
    }
  }
}
