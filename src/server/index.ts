import http from 'node:http';
import { AddressInfo } from 'net';
import express from 'express';
import { debug } from '../utils';
import { router as routeGet } from './routes/get';
import { router as routeSet } from './routes/set';
import { router as routeClear } from './routes/set';
import { GlobalStorageServerConfig, setConfig } from './config';

export class GlobalStorageServer {
  private app = express();
  private server: http.Server | null = null;

  constructor(config: GlobalStorageServerConfig = {}) {
    this.app.use(express.json());
    this.app.use('/', routeGet);
    this.app.use('/', routeSet);
    this.app.use('/', routeClear);
    // this.app.get('/', (req, res) => {
    //   res.send('Global Storage Server is running.');
    // });
    setConfig(this.app, config);
  }

  get url() {
    if (!this.server) return '';
    const { port } = this.server.address() as AddressInfo;
    return `http://localhost:${port}`;
  }

  // See: https://github.com/nodejs/node/issues/21482#issuecomment-626025579
  async start() {
    debug('Starting server...');
    const { port = 0 } = this.app.locals.config;
    await new Promise<void>((resolve, reject) => {
      this.server = this.app.listen(port);
      this.server.once('listening', resolve);
      this.server.once('error', reject);
    });
    debug(`Server started: ${this.url}`);
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
