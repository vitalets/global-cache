import { ensureConfig } from './helpers';
import { GlobalStorage, GlobalStorageConfig } from '../global-storage';
import { globalConfig } from '../global-config';

export class PlaywrightGlobalStorage extends GlobalStorage {
  defineConfig(config: GlobalStorageConfig) {
    ensureConfig('globalStorage.configure()');
    super.defineConfig(config);
  }

  get setup() {
    ensureConfig('globalStorage.setup');
    if (globalConfig.disabled || globalConfig.serverUrl) return '';

    return require.resolve('./global-setup.js');
  }

  get teardown() {
    ensureConfig('globalStorage.teardown');
    if (globalConfig.disabled || globalConfig.serverUrl) return '';

    return require.resolve('./global-teardown.js');
  }
}

export const globalStorage = new PlaywrightGlobalStorage();
