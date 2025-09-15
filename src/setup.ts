import { debug } from './shared/debug';
import { globalConfig } from './config';
import { storageServer } from './server';
import { StorageApi } from './client/api';

async function healthCheckExternalServer(serverUrl: string) {
  try {
    debug('Performing health check on external server...');
    const healthStatus = await new StorageApi(serverUrl).healthCheck();
    debug(
      `External server is healthy: ${healthStatus.status} (uptime: ${Math.round(healthStatus.uptime)}s)`,
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    debug(`External server health check failed: ${errorMessage}`);
    throw new Error(
      `External global-cache server at ${serverUrl} is not accessible: ${errorMessage}`,
    );
  }
}

export default async function globalSetup() {
  if (globalConfig.disabled) {
    debug('Global cache is disabled.');
    return;
  }

  // If serverUrl is already configured, don't start a local server
  if (globalConfig.serverUrl) {
    debug(`Using external global-cache server: ${globalConfig.serverUrl}`);
    await healthCheckExternalServer(globalConfig.serverUrl);
    return;
  }

  // Start local server only if no external serverUrl is provided
  await storageServer.start({
    basePath: globalConfig.basePath,
  });

  globalConfig.update({
    serverUrl: `http://localhost:${storageServer.port}`,
  });
}
