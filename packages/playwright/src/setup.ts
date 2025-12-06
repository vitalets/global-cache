import { globalConfig } from '@global-cache/core';
import { globalCacheServer } from '@global-cache/core/server';

export default async function globalSetup() {
  if (globalConfig.disabled) return;

  // If external server url provided -> skip
  if (globalConfig.externalServerUrl) return;

  // If local server already running -> skip
  if (globalCacheServer.isRunning) return;

  await globalCacheServer.start({ basePath: globalConfig.basePath });
  globalConfig.update({ localServerUrl: globalCacheServer.localUrl });
}
