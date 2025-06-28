import { beforeAll, afterAll, test, expect } from 'vitest';
import { GlobalStorage, GlobalStorageServer } from '../src';

const globalStorage = new GlobalStorage();
const globalStorageServer = new GlobalStorageServer({
  basePath: './test/.global-storage',
});

const values = [42, 'hello', true, { foo: 'bar' }, [1, 2, 3], null, undefined];

beforeAll(async () => {
  await globalStorageServer.start();
  globalStorage.defineConfig({
    serverUrl: globalStorageServer.url,
  });
});

afterAll(async () => {
  await globalStorageServer.stop();
});

test('store value in memory', async () => {
  for (const value of values) {
    let callCount = 0;
    const fn = () =>
      globalStorage.getOrCall(`memory-${JSON.stringify(value)}`, async () => {
        callCount++;
        return value;
      });

    const value1 = await fn();
    const value2 = await fn();

    expect(callCount).toEqual(1);
    expect(value1).toEqual(value);
    expect(value2).toEqual(value);
  }
});

test('store value in fs', async () => {
  const ttl = 50;
  for (const value of values) {
    let callCount = 0;
    const fn = () =>
      globalStorage.getOrCall(`fs-${JSON.stringify(value)}`, { ttl: `${ttl}ms` }, async () => {
        callCount++;
        return value;
      });

    const value1 = await fn();
    const value2 = await fn();
    await new Promise((r) => setTimeout(r, ttl + 10)); // wait for vlaue to expire
    const value3 = await fn();
    await globalStorage.clearMemory(); // clear memory to re-read from file
    const value4 = await fn();

    expect(callCount).toEqual(2);
    expect(value1).toEqual(value);
    expect(value2).toEqual(value);
    expect(value3).toEqual(value);
    expect(value4).toEqual(value);
  }
});

// check error
