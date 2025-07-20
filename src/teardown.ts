import { debug } from './utils';
import { globalStorage } from './global-storage';
import { globalConfig } from './global-config';
import { globalStorageServer } from './server';

export default async function globalTeardown() {
  debug('Running global teardown...');

  if (!globalConfig.externalRunId) {
    await globalStorage.clearMemory();
  }

  if (globalStorageServer.listening) {
    await globalStorageServer.stop();
  }
}
