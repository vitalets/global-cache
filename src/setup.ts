import { randomUUID } from 'node:crypto';
import { debug } from './shared/debug';
import { globalConfig } from './config';
import { storageServer } from './server';

export default async function globalSetup() {
  if (globalConfig.disabled) {
    debug('Global cache is disabled.');
    return;
  }

  // generate unique runId on every global setup call
  globalConfig.update({ runId: process.env.GLOBAL_CACHE_RUN_ID || randomUUID() });

  // todo: don't start if serverUrl is set
  if (storageServer.isRunning) return;

  await storageServer.start({
    basePath: globalConfig.basePath,
  });

  globalConfig.update({
    serverUrl: `http://localhost:${storageServer.port}`,
  });
}
