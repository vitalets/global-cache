import { beforeAll, afterAll, test, expect } from 'vitest';
import { GlobalStorage, GlobalStorageServer } from '../src';

const globalStorage = new GlobalStorage();
const globalStorageServer = new GlobalStorageServer({
  basePath: './test/.global-storage',
});

beforeAll(async () => {
  await globalStorageServer.start();
  globalStorage.defineConfig({
    serverUrl: globalStorageServer.url,
  });
});

afterAll(async () => {
  await globalStorageServer.stop();
});

test('should store value in memory', async () => {
  let count = 0;
  const fn = () => globalStorage.getOrCall('testKey', () => count++);

  const value1 = await fn();
  const value2 = await fn();

  expect(value1).toBe(0);
  expect(value2).toBe(0);
});

// todo: test value types: string, number, boolean, object, array, null, undefined
