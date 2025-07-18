import { debug } from '../utils';
import { globalConfig } from '../global-config';
import { globalStorageServer } from '../server';

export default async function globalSetup() {
  debug('Global setup...');

  await globalStorageServer.start({
    basePath: globalConfig.basePath,
  });

  globalConfig.update({
    serverUrl: `http://localhost:${globalStorageServer.port}`,
  });
}
