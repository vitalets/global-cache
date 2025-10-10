import { DefaultKeysSchema, GlobalCacheClient, globalConfig } from '@global-cache/core';
import { addGlobalHook, addReporter, PlaywrightLikeConfig } from './pw-config';

export class GlobalCache<
  S extends DefaultKeysSchema = DefaultKeysSchema,
> extends GlobalCacheClient<S> {
  /**
   * Wrap Playwright config to include global-cache setup, teardown and reporter.
   */
  wrap<T extends PlaywrightLikeConfig>(config: T) {
    return globalConfig.disabled
      ? config
      : {
          ...config,
          globalSetup: addGlobalHook(config.globalSetup, this.setup),
          globalTeardown: addGlobalHook(config.globalTeardown, this.teardown),
          reporter: addReporter(config.reporter, this.reporter),
        };
  }

  get setup() {
    return require.resolve('./setup.js');
  }

  get teardown() {
    return require.resolve('./teardown.js');
  }

  get reporter() {
    return require.resolve('./reporter.js');
  }
}

export const globalCache = new GlobalCache();
