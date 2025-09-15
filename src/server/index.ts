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
import { router as routeGet } from './routes/get';
import { router as routeSet } from './routes/set';
import { router as routeGetStale } from './routes/get-stale';
import { router as routeGetStaleList } from './routes/get-stale-list';
import { router as routeClearSession } from './routes/clear-session';
import { router as routeHealth } from './routes/health';
import { errorHandler } from './error';
import { GlobalStorageServerConfig, setConfig } from './config';

export class StorageServer {
  private app = express();
  private server: http.Server | null = null;

  constructor() {
    this.app.use(express.json());
    this.app.use('/', routeGet);
    this.app.use('/', routeSet);
    this.app.use('/', routeGetStale);
    this.app.use('/', routeGetStaleList);
    this.app.use('/', routeClearSession);
    this.app.use('/', routeHealth);
    // Basic info endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Global Cache Server',
        version: process.env.npm_package_version || '1.0.0',
        status: 'running',
        endpoints: [
          'GET /health - Health check',
          'GET /cache/:key - Get cached value',
          'POST /cache/:key - Set cached value',
          'GET /cache-stale/:key - Get stale value',
          'GET /cache-stale-list/:prefix - Get stale values by prefix',
          'DELETE /session - Clear session',
        ],
      });
    });
    // Must be after all other middleware and routes
    this.app.use(errorHandler);
  }

  get port() {
    const { port = 0 } = this.server ? (this.server.address() as AddressInfo) : {};
    return port;
  }

  /**
   * Start server.
   * See: https://github.com/nodejs/node/issues/21482#issuecomment-626025579
   */
  async start(config: GlobalStorageServerConfig = {}) {
    debug('Starting server...');
    setConfig(this.app, config);
    await new Promise<void>((resolve, reject) => {
      this.server = this.app.listen(config.port || 0, '0.0.0.0');
      this.server.once('listening', resolve);
      this.server.once('error', reject);
    });
    debug(`Server started on port: ${this.port}`);
  }

  async stop() {
    if (this.server?.listening) {
      debug('Stopping server...');
      await new Promise<void>((resolve, reject) => {
        this.server?.close((err) => (err ? reject(err) : resolve()));
      });
      this.server = null;
      debug('Server stopped.');
    }
  }
}

/* Export a default instance for easier access in single instance mode */
export const storageServer = new StorageServer();
