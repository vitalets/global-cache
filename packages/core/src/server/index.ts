/**
 * Storage Server.
 * An HTTP server that provides a simple key-value globalCache.
 * Can be launched locally or on a dedicated environment (standalone).
 *
 * This file is exported separately from the main index file, to not be loaded in workers.
 */
import http from 'node:http';
import { AddressInfo } from 'net';
import express from 'express';
import { debug } from '../shared/debug';
import { router as routeRoot } from './routes/root';
import { router as routeGet } from './routes/get';
import { router as routeSet } from './routes/set';
import { router as routeGetStale } from './routes/get-stale';
import { router as routeGetStaleList } from './routes/get-stale-list';
import { router as routeClearTestRun } from './routes/clear';
import { errorHandler } from './error';
import { GlobalCacheServerConfig, resolveConfig, setConfig } from './config';
import { startExpressServer, stopExpressServer } from './utils/express';

export class GlobalCacheServer {
  private app = express();
  private server: http.Server | null = null;

  constructor() {
    this.app.use(express.json());
    this.app.use('/', routeRoot);
    this.app.use('/', routeGet);
    this.app.use('/', routeSet);
    this.app.use('/', routeGetStale);
    this.app.use('/', routeGetStaleList);
    this.app.use('/', routeClearTestRun);
    // Must be after all other middleware and routes
    this.app.use(errorHandler);
  }

  get port() {
    const { port = 0 } = this.server ? (this.server.address() as AddressInfo) : {};
    return port;
  }

  get localUrl() {
    return `http://localhost:${this.port}`;
  }

  get isRunning() {
    return Boolean(this.server?.listening);
  }

  async start(providedConfig?: GlobalCacheServerConfig) {
    // todo: if server is already running?
    debug('Starting server...');
    const config = resolveConfig(providedConfig);
    setConfig(this.app, config);
    this.server = await startExpressServer(this.app, config.port);
    debug(`Starting server: done ${this.localUrl}`);
  }

  async stop() {
    if (!this.isRunning || !this.server) return;
    debug(`Stopping server on port: ${this.port}`);
    try {
      await stopExpressServer(this.server);
    } finally {
      this.server = null;
    }
    debug('Stopping server: done.');
  }
}

/* Export a default instance - convenient for usage */
export const globalCacheServer = new GlobalCacheServer();
