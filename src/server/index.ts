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
import { router as routeClearSession } from './routes/clear';
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
    // todo:
    // this.app.get('/', (req, res) => {
    //   res.send('Global Storage Server is running.');
    // });
    // Must be after all other middleware and routes
    this.app.use(errorHandler);
  }

  get port() {
    const { port = 0 } = this.server ? (this.server.address() as AddressInfo) : {};
    return port;
  }

  get isRunning() {
    return Boolean(this.server?.listening);
  }

  /**
   * Start server.
   * See: https://github.com/nodejs/node/issues/21482#issuecomment-626025579
   */
  async start(config: GlobalStorageServerConfig = {}) {
    debug('Starting server...');
    setConfig(this.app, config);
    await new Promise<void>((resolve, reject) => {
      this.server = this.app.listen(config.port || 0);
      this.server.once('listening', resolve);
      this.server.once('error', reject);
    });
    debug(`Server started on port: ${this.port}`);
  }

  async stop() {
    if (!this.isRunning) return;
    debug('Stopping server...');
    await new Promise<void>((resolve, reject) => {
      this.server?.close((err) => (err ? reject(err) : resolve()));
    });
    this.server = null;
    debug('Server stopped.');
  }
}

/* Export a default instance for easier access in single instance mode */
export const storageServer = new StorageServer();
