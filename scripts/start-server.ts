/**
 * Script to start global-cache server.
 * npx tsx scripts/start-server.ts
 */

import { globalCacheServer } from '../packages/core/src/server';

const logger = console;

main();

async function main() {
  await globalCacheServer.start();
  logger.log(`Global Cache Server is running at: ${globalCacheServer.localUrl}`);
}
