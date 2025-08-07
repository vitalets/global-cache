import fs from 'node:fs';
import { beforeAll, afterAll, afterEach, test, expect, describe } from 'vitest';
import { globalCache } from '../src';

const basePath = './test/.global-cache';

beforeAll(async () => {
  if (fs.existsSync(basePath)) {
    fs.rmSync(basePath, { recursive: true });
  }

  globalCache.defineConfig({ basePath });

  const { default: globalSetup } = await import('../src/setup.js');
  // @ts-expect-error callable
  await globalSetup();
});

afterAll(async () => {
  const { default: globalTeardown } = await import('../src/teardown.js');
  // @ts-expect-error callable
  await globalTeardown();
});

afterEach(async () => {
  await globalCache.clear();
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
        globalCache.get(`memory-${JSON.stringify(value)}`, async () => {
          callCount++;
          return value;
        });

      const [value1, value2] = await Promise.all([fn(), fn()]);
      const value3 = await fn();
      await globalCache.clear();
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
        globalCache.get(`persistent-${JSON.stringify(value)}`, { ttl }, async () => {
          callCount++;
          return value;
        });

      const [value1, value2] = await Promise.all([fn(), fn()]);
      const value3 = await fn();
      await globalCache.clear();
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
    const fn = () => globalCache.get(key, () => [undefined]);

    const value1 = await fn();
    const value2 = await fn();

    expect(value1).toEqual([null]);
    expect(value2).toEqual([null]);
  });

  test('error while computing value', async () => {
    const fn = () =>
      globalCache.get(`error-key`, async () => {
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
    const value1 = await globalCache.getStale(key);
    const value2 = await globalCache.get(key, () => 42);
    const value3 = await globalCache.getStale(key);

    expect(value1).toEqual(undefined);
    expect(value2).toEqual(42);
    expect(value3).toEqual(42);
  });

  test('persistent', async () => {
    let callCount = 0;
    const ttl = 50;
    const key = 'get-stale-persistent';
    const fn = () => globalCache.get(key, { ttl }, () => ++callCount);
    const value1 = await globalCache.getStale(key);
    const value2 = await fn();
    const value3 = await globalCache.getStale(key);
    await new Promise((r) => setTimeout(r, ttl + 10));
    const value4 = await fn();
    const value5 = await globalCache.getStale(key);

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
    const fn = () => globalCache.get(`${prefix}-persistent`, { ttl }, () => ++callCount);
    await globalCache.get(`${prefix}-session-1`, () => 11);
    await globalCache.get(`${prefix}-session-2`, () => 22);
    await fn();
    await fn();
    await globalCache.get(`excluded-key`, () => 3);

    const values = await globalCache.getStaleList(prefix);

    expect(values).toEqual([11, 22, null]);
  });
});

describe('ignoreTTL: true', () => {
  beforeAll(() => {
    globalCache.defineConfig({ ignoreTTL: true });
  });

  afterAll(() => {
    globalCache.defineConfig({ ignoreTTL: false });
  });

  test('value with ttl is not persistent', async () => {
    const key = 'ignore-ttl-key';
    let callCount = 0;
    const fn = () =>
      globalCache.get(key, { ttl: 50 }, () => {
        callCount++;
        return 42;
      });
    const value1 = await fn();
    const value2 = await globalCache.getStale(key);
    await globalCache.clear();
    const value3 = await fn(); // increment callCount as ttl is ignored

    expect(callCount).toEqual(2);
    expect(value1).toEqual(42);
    expect(value2).toEqual(42); // 42 because value is not persistent
    expect(value3).toEqual(42);
  });
});
