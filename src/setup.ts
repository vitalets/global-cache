import { debug } from './utils/debug';
import { globalConfig } from './global-config';
import { globalStorageServer } from './server';

export default async function globalSetup() {
  if (globalConfig.disabled) {
    debug('Global-storage is disabled.');
    return;
  }

  await globalStorageServer.start({
    basePath: globalConfig.basePath,
  });

  globalConfig.update({
    serverUrl: `http://localhost:${globalStorageServer.port}`,
  });
}
