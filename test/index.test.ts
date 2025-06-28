import fs from 'node:fs';
import { beforeAll, afterAll, test, expect } from 'vitest';
import { GlobalStorage, GlobalStorageServer } from '../src';

const globalStorage = new GlobalStorage();
const globalStorageServer = new GlobalStorageServer({
  basePath: './test/.global-storage',
});

const values = [42, 'hello', true, { foo: 'bar' }, [1, 2, 3], null, undefined];

beforeAll(async () => {
  if (fs.existsSync(globalStorageServer.config.basePath)) {
    fs.rmSync(globalStorageServer.config.basePath, { recursive: true });
  }
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

    const [value1, value2] = await Promise.all([fn(), fn()]);
    const value3 = await fn();

    expect(callCount).toEqual(1);
    expect(value1).toEqual(value);
    expect(value2).toEqual(value);
    expect(value3).toEqual(value);
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

    const [value1, value2] = await Promise.all([fn(), fn()]);
    const value3 = await fn();
    await new Promise((r) => setTimeout(r, ttl + 10)); // wait for vlaue to expire
    const value4 = await fn();
    await globalStorage.clearMemory(); // clear memory to re-read from file
    const value5 = await fn();

    expect(callCount).toEqual(2);
    expect(value1).toEqual(value);
    expect(value2).toEqual(value);
    expect(value3).toEqual(value);
    expect(value4).toEqual(value);
    expect(value5).toEqual(value);
  }
});

test('error', async () => {
  const fn = () =>
    globalStorage.getOrCall(`error-key`, async () => {
      throw new Error('foo');
    });

  await Promise.all([
    expect(fn()).rejects.toThrow('foo'), // prettier-ignore
    expect(fn()).rejects.toThrow('foo'),
  ]);
});
