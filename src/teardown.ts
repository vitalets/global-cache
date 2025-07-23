import { globalStorageServer } from './server';

export default async function globalTeardown() {
  await globalStorageServer.stop();
}
