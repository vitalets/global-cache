import fs from 'node:fs';
import { beforeAll, afterAll, test, expect, describe } from 'vitest';
import { globalStorage } from '../src';
// this import is only for testing purposes
import { storage as serverStorage } from '../src/server/storage';
import { afterEach } from 'node:test';

const basePath = './test/.global-storage';

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

describe('get', () => {
  describe('non-persistent', () => {
    test('string', () => checkNonPersistentValue('hello'));
    test('number', () => checkNonPersistentValue(42));
    test('boolean', () => checkNonPersistentValue(true));
    test('object', () => checkNonPersistentValue({ foo: 'bar' }));
    test('array', () => checkNonPersistentValue([1, 2, 3, null]));
    test('null', () => checkNonPersistentValue(null));
    test('undefined', () => checkNonPersistentValue(undefined));

    async function checkNonPersistentValue(value: unknown) {
      let callCount = 0;
      const fn = () =>
        globalStorage.get(`memory-${JSON.stringify(value)}`, async () => {
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

  describe('persistent', () => {
    test('string', () => checkPersistentValue('hello'));
    test('number', () => checkPersistentValue(42));
    test('boolean', () => checkPersistentValue(true));
    test('object', () => checkPersistentValue({ foo: 'bar' }));
    test('array', () => checkPersistentValue([1, 2, 3, null]));
    test('null', () => checkPersistentValue(null));
    test('undefined', () => checkPersistentValue(undefined));

    async function checkPersistentValue(value: unknown) {
      let callCount = 0;
      const ttl = 50;

      const fn = () =>
        globalStorage.get(`persistent-${JSON.stringify(value)}`, { ttl }, async () => {
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

  test('undefined is converted to null in array', async () => {
    const key = 'undefined-in-array';
    const fn = () => globalStorage.get(key, () => [undefined]);

    const value1 = await fn();
    const value2 = await fn();

    expect(value1).toEqual([null]);
    expect(value2).toEqual([null]);
  });

  test('error while computing value', async () => {
    const fn = () =>
      globalStorage.get(`error-key`, async () => {
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
    const value2 = await globalStorage.get(key, () => 42);
    const value3 = await globalStorage.getStale(key);

    expect(value1).toEqual(undefined);
    expect(value2).toEqual(42);
    expect(value3).toEqual(42);
  });

  test('persistent', async () => {
    let callCount = 0;
    const ttl = 50;
    const key = 'get-stale-persistent';
    const fn = () => globalStorage.get(key, { ttl }, () => ++callCount);
    const value1 = await globalStorage.getStale(key);
    const value2 = await fn();
    const value3 = await globalStorage.getStale(key);
    await new Promise((r) => setTimeout(r, ttl + 10));
    const value4 = await fn();
    const value5 = await globalStorage.getStale(key);

    expect(value1).toEqual(undefined);
    expect(value2).toEqual(1);
    expect(value3).toEqual(undefined); // undefined is expected, as for persistent keys old value is returned
    expect(value4).toEqual(2);
    expect(value5).toEqual(1); // stale value is the old one
  });
});

describe('getStaleList', () => {
  test('non-persistent + persistent', async () => {
    let callCount = 0;
    const ttl = 50;
    const prefix = 'get-stale-list';
    const fn = () => globalStorage.get(`${prefix}-persistent`, { ttl }, () => ++callCount);
    await globalStorage.get(`${prefix}-session-1`, () => 11);
    await globalStorage.get(`${prefix}-session-2`, () => 22);
    await fn();
    await fn();
    await globalStorage.get(`excluded-key`, () => 3);

    const values = await globalStorage.getStaleList(prefix);

    expect(values).toEqual([11, 22, null]);
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
      globalStorage.get(key, { ttl: 50 }, () => {
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
