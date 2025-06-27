import { globalConfig } from '../global-config';
import { debug } from '../utils';
import { globalStorageServer } from './global-setup';
// import { globalStorage } from '.';

export default async function globalTeardown() {
  debug('Running global teardown...');
  if (globalConfig.ownRunId) {
    // fetch request to clear memory
    // await globalStorageServer.clearMemory(globalConfig.ownRunId);
  }
  await globalStorageServer.stop();
}
