import { debug } from './utils/debug';
import { globalConfig } from './config';
import { storageServer } from './server';

export default async function globalSetup() {
  if (globalConfig.disabled) {
    debug('Parallel storage is disabled.');
    return;
  }

  await storageServer.start({
    basePath: globalConfig.basePath,
  });

  globalConfig.update({
    serverUrl: `http://localhost:${storageServer.port}`,
  });
}
