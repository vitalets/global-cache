#!/usr/bin/env node

/**
 * Standalone server entry point for Docker deployments.
 * This allows running the global-cache server as a dedicated service.
 */

import { StorageServer } from './server';

interface ServerConfig {
  port?: number;
  basePath?: string;
  host?: string;
}

const { log, error: consoleError } = console;

function getServerConfig(): ServerConfig {
  return {
    port: parseInt(process.env.PORT || '3000', 10),
    basePath: process.env.CACHE_BASE_PATH || '/app/cache',
    host: process.env.HOST || '0.0.0.0',
  };
}

function setupGracefulShutdown(server: StorageServer) {
  const shutdown = async (signal: string) => {
    log(`Received ${signal}, shutting down gracefully...`);
    try {
      await server.stop();
      process.exit(0);
    } catch (error) {
      consoleError('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

function logServerStarted(config: ServerConfig, actualPort: number) {
  log(`✅ Global Cache Server started successfully`);
  log(`🌐 Server URL: http://${config.host}:${actualPort}`);
  log(`📁 Cache Path: ${config.basePath}`);
  log(`🚀 Ready to accept connections`);
}

async function startServer() {
  const config = getServerConfig();

  log('Starting Global Cache Server...');
  log(`Configuration:`, config);

  const server = new StorageServer();
  setupGracefulShutdown(server);

  try {
    await server.start({
      port: config.port,
      basePath: config.basePath,
    });

    logServerStarted(config, server.port);
  } catch (error) {
    consoleError('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer().catch((error) => {
  consoleError('Fatal error:', error);
  process.exit(1);
});
