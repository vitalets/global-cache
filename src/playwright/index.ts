import { ensureConfig } from './helpers';
import { GlobalStorage, GlobalStorageConfig } from '..';

export class PlaywrightGlobalStorage extends GlobalStorage {
  configure(config: GlobalStorageConfig) {
    ensureConfig('globalStorage.configure()');
    super.configure(config);
  }

  get setup() {
    ensureConfig('globalStorage.setup');
    super.configure(this.config);
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
