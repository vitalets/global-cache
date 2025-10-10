import { globalConfig } from '@global-cache/core';
import { globalCacheServer } from '@global-cache/core/server';

export default async function globalSetup() {
  if (globalConfig.disabled) return;

  // Generate unique runId on every global setup call
  globalConfig.newTestRun();

  // If external server url provided or server is already running -> skip
  if (globalConfig.serverUrl) return;

  await globalCacheServer.start({ basePath: globalConfig.basePath });

  globalConfig.update({
    serverUrl: `http://localhost:${globalCacheServer.port}`,
  });
}
