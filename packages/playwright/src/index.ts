import { DefaultKeysSchema, GlobalCacheClient, globalConfig } from '@global-cache/core';
import { addGlobalHook, addReporter, PlaywrightLikeConfig } from './pw-config';

export type WrapOptions = {
  /**
   * Callback to run after each test-run, before global-cache resets.
   * Runs reliably in VSCode and UI mode (unlike globalTeardown).
   *
   * > **Note:** Prefer dynamic imports inside this callback over static imports
   * > at the top of playwright.config.ts. Static imports are evaluated in every
   * > worker process, while this callback only runs in the main process.
   */
  cleanup?: () => Promise<void> | void;
};

export class GlobalCache<
  S extends DefaultKeysSchema = DefaultKeysSchema,
> extends GlobalCacheClient<S> {
  cleanup?: () => Promise<void> | void;

  /**
   * Wrap Playwright config to include global-cache setup, teardown and reporter.
   */
  wrap<T extends PlaywrightLikeConfig>(config: T, options?: WrapOptions) {
    if (options?.cleanup) this.cleanup = options.cleanup;
    return globalConfig.disabled
      ? config
      : {
          ...config,
          globalSetup: addGlobalHook(config.globalSetup, this.setup),
          reporter: addReporter(config.reporter, this.reporter),
        };
  }

  get setup() {
    return require.resolve('./setup.js');
  }

  get reporter() {
    return require.resolve('./reporter.js');
  }
}

export const globalCache = new GlobalCache();
