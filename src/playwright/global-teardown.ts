import { stopServer } from '../server';
import { debug } from '../utils';

export default async function globalTeardown() {
  debug('Stopping server in global teardown...');
  // todo: clear memory storage
  await stopServer();
  debug('Server stopped.');
}
