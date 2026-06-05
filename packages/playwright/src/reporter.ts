/**
 * Reporter that owns the end-of-run lifecycle for global-cache.
 * See AGENTS.md "Lifecycle Architecture" for the full reasoning.
 */
import { logger } from '@global-cache/core';
import { globalCache } from '.';

export default class GlobalCacheReporter {
  printsToStdio() {
    return false;
  }

  async onEnd() {
    await this.runCustomCleanup();
    await globalCache.resetTestRun();
  }

  protected async runCustomCleanup() {
    try {
      await globalCache.cleanup?.();
    } catch (e) {
      logger.error(`global-cache cleanup error:\n${e instanceof Error ? e.stack : e}`);
    }
  }
}
