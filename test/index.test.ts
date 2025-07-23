import fs from 'node:fs';
import { beforeAll, afterAll, test, expect, describe } from 'vitest';
import { globalStorage } from '../src';
// this import is only for testing purposes
import { storage as serverStorage } from '../src/server/storage';
import { afterEach } from 'node:test';

const basePath = './test/.global-storage';
const values = [42, 'hello', true, { foo: 'bar' }, [1, 2, 3], null, undefined];

beforeAll(async () => {
  if (fs.existsSync(basePath)) {
    fs.rmSync(basePath, { recursive: true });
  }

  globalStorage.defineConfig({ basePath });

  const { default: globalSetup } = await import('../src/setup.js');
  // @ts-expect-error callable
  await globalSetup();
});

afterAll(async () => {
  const { default: globalTeardown } = await import('../src/teardown.js');
  // @ts-expect-error callable
  await globalTeardown();
});

afterEach(() => {
  serverStorage.clearSession();
});

describe('getOrCompute', () => {
  test('compute, store and re-use different value types (non-persistent)', async () => {
    for (const value of values) {
      let callCount = 0;
      const fn = () =>
        globalStorage.getOrCompute(`memory-${JSON.stringify(value)}`, async () => {
          callCount++;
          return value;
        });

      const [value1, value2] = await Promise.all([fn(), fn()]);
      const value3 = await fn();
      serverStorage.clearSession();
      const value4 = await fn();

      expect(callCount).toEqual(2);
      expect(value1).toEqual(value);
      expect(value2).toEqual(value);
      expect(value3).toEqual(value);
      expect(value4).toEqual(value);
    }
  });

  test('compute, store and re-use different value types (persistent)', async () => {
    const ttl = 50;
    for (const value of values) {
      let callCount = 0;
      const fn = () =>
        globalStorage.getOrCompute(`persistent-${JSON.stringify(value)}`, { ttl }, async () => {
          callCount++;
          return value;
        });

      const [value1, value2] = await Promise.all([fn(), fn()]);
      const value3 = await fn();
      serverStorage.clearSession();
      const value4 = await fn();
      await new Promise((r) => setTimeout(r, ttl + 10)); // wait for value to expire
      const value5 = await fn(); // increments callCount again

      expect(callCount).toEqual(2);
      expect(value1).toEqual(value);
      expect(value2).toEqual(value);
      expect(value3).toEqual(value);
      expect(value4).toEqual(value);
      expect(value5).toEqual(value);
    }
  });

  test('error while computing value', async () => {
    const fn = () =>
      globalStorage.getOrCompute(`error-key`, async () => {
        throw new Error('foo');
      });

    await Promise.all([
      expect(fn()).rejects.toThrow('foo'), // prettier-ignore
      expect(fn()).rejects.toThrow('foo'),
    ]);
  });
});

describe('getStale', () => {
  test('non-persistent', async () => {
    const key = 'get-stale-non-persistent';
    const value1 = await globalStorage.getStale(key);
    const value2 = await globalStorage.getOrCompute(key, () => 42);
    const value3 = await globalStorage.getStale(key);

    expect(value1).toEqual(undefined);
    expect(value2).toEqual(42);
    expect(value3).toEqual(42);
  });

  test('persistent', async () => {
    const ttl = 50;
    const key = 'get-stale-persistent';
    const value1 = await globalStorage.getStale(key);
    const value2 = await globalStorage.getOrCompute(key, { ttl }, () => 123);
    const value3 = await globalStorage.getStale(key);
    await new Promise((r) => setTimeout(r, ttl + 10));
    const value4 = await globalStorage.getOrCompute(key, { ttl }, () => 456);
    const value5 = await globalStorage.getStale(key);

    expect(value1).toEqual(undefined);
    expect(value2).toEqual(123);
    expect(value3).toEqual(undefined); // undefined is expected, as for persistent keys old value is returned
    expect(value4).toEqual(456);
    expect(value5).toEqual(123); // stale value is the old one
  });
});

describe('ignoreTTL: true', () => {
  beforeAll(() => {
    globalStorage.defineConfig({ ignoreTTL: true });
  });

  afterAll(() => {
    globalStorage.defineConfig({ ignoreTTL: false });
  });

  test('value with ttl is not persistent', async () => {
    const key = 'ignore-ttl-key';
    let callCount = 0;
    const fn = () =>
      globalStorage.getOrCompute(key, { ttl: 50 }, () => {
        callCount++;
        return 42;
      });
    const value1 = await fn();
    const value2 = await globalStorage.getStale(key);
    serverStorage.clearSession();
    const value3 = await fn(); // increment callCount as ttl is ignored

    expect(callCount).toEqual(2);
    expect(value1).toEqual(42);
    expect(value2).toEqual(42); // 42 because value is not persistent
    expect(value3).toEqual(42);
  });
});
