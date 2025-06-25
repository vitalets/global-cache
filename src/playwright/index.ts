import { ensureConfig } from './helpers';
import { GlobalStorage, GlobalStorageConfig } from '..';

export class PlaywrightGlobalStorage extends GlobalStorage {
  defineConfig(config: GlobalStorageConfig) {
    ensureConfig('globalStorage.configure()');
    super.defineConfig(config);
  }

  get setup() {
    ensureConfig('globalStorage.setup');
    super.defineConfig(this.config);
    if (this.config.disabled || this.config.url) return '';

    return require.resolve('./global-setup.js');
  }

  get teardown() {
    ensureConfig('globalStorage.teardown');
    if (this.config.disabled || this.config.url) return '';

    return require.resolve('./global-teardown.js');
  }
}

export const globalStorage = new PlaywrightGlobalStorage();
