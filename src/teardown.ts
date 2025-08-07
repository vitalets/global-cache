import { storageServer } from './server';

export default async function globalTeardown() {
  await storageServer.stop();
}
