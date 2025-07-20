/**
 * Global Storage Server.
 * An HTTP server that provides a simple key-value storage.
 * Can be launched locally or on a dedicated environment (standalone).
 *
 * This file is exported separately from the main index file, to not be loaded in workers.
 */
import http from 'node:http';
import { AddressInfo } from 'net';
import express from 'express';
import { debug } from '../utils';
import { router as routeGet } from './routes/get';
import { router as routeSet } from './routes/set';
import { router as routeClear } from './routes/clear';
import { GlobalStorageServerConfig, setConfig } from './config';

export class GlobalStorageServer {
  private app = express();
  private server: http.Server | null = null;

  constructor() {
    this.app.use(express.json());
    this.app.use('/', routeGet);
    this.app.use('/', routeSet);
    this.app.use('/', routeClear);
    // todo:
    // this.app.get('/', (req, res) => {
    //   res.send('Global Storage Server is running.');
    // });
  }

  get port() {
    const { port = 0 } = this.server ? (this.server.address() as AddressInfo) : {};
    return port;
  }

  get listening() {
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
    if (this.server) {
      debug('Stopping server...');
      await new Promise<void>((resolve, reject) => {
        this.server?.close((err) => (err ? reject(err) : resolve()));
      });
      this.server = null;
      debug('Server stopped.');
    }
  }
}

/* Export a singleton instance of GlobalStorageServer for easy access */
export const globalStorageServer = new GlobalStorageServer();
