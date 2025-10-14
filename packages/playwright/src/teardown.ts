import { globalConfig } from '@global-cache/core';
import { globalCacheServer } from '@global-cache/core/server';

export default async function globalTeardown() {
  await globalCacheServer.stop();
  globalConfig.update({ localServerUrl: '' });
}
