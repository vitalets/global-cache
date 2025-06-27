import { globalConfig } from '../global-config';
import { GlobalStorageServer } from '../server';
import { debug } from '../utils';

export const globalStorageServer = new GlobalStorageServer({
  basePath: globalConfig.basePath,
});

export default async function globalSetup() {
  debug('Global setup...');
  await globalStorageServer.start();
  globalConfig.update({ serverUrl: globalStorageServer.url });
}
