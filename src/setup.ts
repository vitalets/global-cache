import { debug } from './utils';
import { globalConfig } from './global-config';
import { globalStorageServer } from './server';

export default async function globalSetup() {
  debug('Global setup...');

  if (globalConfig.disabled) {
    debug('Global-storage is disabled.');
    return;
  }

  if (globalConfig.serverUrl) {
    debug(`Using external global-storage server: ${globalConfig.serverUrl}`);
    return;
  }

  await globalStorageServer.start({
    basePath: globalConfig.basePath,
  });

  globalConfig.update({
    serverUrl: `http://localhost:${globalStorageServer.port}`,
  });
}
