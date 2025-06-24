import { AddressInfo } from 'net';
import { startServer } from '../server';
import { debug } from '../utils';
import { env } from '../env';

export default async function globalSetup() {
  debug('Starting server in global setup...');
  const server = await startServer();
  const { port } = server.address() as AddressInfo;
  env.serverUrl = `http://localhost:${port}`;
  debug('Server started:', env.serverUrl);
}
