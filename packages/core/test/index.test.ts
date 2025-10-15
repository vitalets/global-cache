import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, afterAll, afterEach, test, expect, describe, vi } from 'vitest';
import { GlobalCacheClient, globalConfig } from '../src';
import { globalCacheServer } from '../src/server';
import { beforeEach } from 'node:test';

const basePath = path.join(__dirname, '.global-cache');
const globalCache = new GlobalCacheClient();

beforeAll(async () => {
  clearDir(basePath);
  await globalCacheServer.start({ basePath });
  globalConfig.update({ localServerUrl: globalCacheServer.localUrl });
});

afterAll(async () => {
  await globalCacheServer.stop();
});

afterEach(async () => {
  await globalCache.clearTestRun();
});

describe('get', () => {
  test('non-persistent (basic flow)', async () => {
    let callCount = 0;
    const value = 'foo';
    const fn = () =>
      globalCache.get(`non-persistent-basic-flow`, async () => {
        callCount++;
        return value;
      });

    const [value1, value2] = await Promise.all([fn(), fn()]);
    const value3 = await fn();

    expect(callCount).toEqual(1);
    expect(value1).toEqual(value);
    expect(value2).toEqual(value);
    expect(value3).toEqual(value);
  });

  test('persistent (basic flow)', async () => {
    let callCount = 0;
    const value = 'foo';
    const ttl = 50;

    const fn = () =>
      globalCache.get(`persistent-basic-flow`, { ttl }, async () => {
        callCount++;
        return value;
      });

    const [value1, value2] = await Promise.all([fn(), fn()]);
    const value3 = await fn();
    await waitForExpire(ttl);
    const value4 = await fn();

    expect(callCount).toEqual(2);
    expect(value1).toEqual(value);
    expect(value2).toEqual(value);
    expect(value3).toEqual(value);
    expect(value4).toEqual(value);
  });

  describe('non-persistent (different values)', () => {
    test('string', () => checkNonPersistentValue('hello'));
    test('number', () => checkNonPersistentValue(42));
    test('boolean', () => checkNonPersistentValue(true));
    test('object', () => checkNonPersistentValue({ foo: 'bar' }));
    test('array', () => checkNonPersistentValue([1, 2, 3, null]));
    test('null', () => checkNonPersistentValue(null));
    test('undefined', () => checkNonPersistentValue(undefined));

    async function checkNonPersistentValue(value: unknown) {
      const fn = () => globalCache.get(`memory-${JSON.stringify(value)}`, () => value);
      const value1 = await fn();
      expect(value1).toEqual(value);
    }
  });

  describe('persistent (different values)', () => {
    test('string', () => checkPersistentValue('hello'));
    test('number', () => checkPersistentValue(42));
    test('boolean', () => checkPersistentValue(true));
    test('object', () => checkPersistentValue({ foo: 'bar' }));
    test('array', () => checkPersistentValue([1, 2, 3, null]));
    test('null', () => checkPersistentValue(null));
    test('undefined', () => checkPersistentValue(undefined));

    async function checkPersistentValue(value: unknown) {
      const ttl = 50;
      const fn = () =>
        globalCache.get(`persistent-${JSON.stringify(value)}`, { ttl }, async () => value);

      const value1 = await fn();
      await waitForExpire(ttl);
      const value2 = await fn();

      expect(value1).toEqual(value);
      expect(value2).toEqual(value);
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
    await globalCache.clearTestRun();
    await new Promise((r) => setTimeout(r, ttl + 10)); // wait for value to expire
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
  test('non-persistent', async () => {
    let callCount = 0;
    const prefix = 'get-stale-list-non-persistent';
    const fn1 = () => globalCache.get(`${prefix}-1`, () => ++callCount);
    const fn2 = () => globalCache.get(`${prefix}-2`, () => ++callCount);
    const fnExcluded = () => globalCache.get(`excluded-${prefix}`, () => 3);
    await fn1();
    await fn2();
    await fnExcluded();

    const values = await globalCache.getStaleList(prefix);

    expect(values).toEqual([1, 2]);
  });

  test('persistent', async () => {
    let callCount = 0;
    const ttl = 50;
    const prefix = 'get-stale-list-persistent';
    const fn1 = () => globalCache.get(`${prefix}-1`, { ttl }, () => ++callCount);
    const fn2 = () => globalCache.get(`${prefix}-2`, { ttl }, () => ++callCount);
    const fnExcluded = () => globalCache.get(`excluded-${prefix}`, { ttl }, () => 3);

    await fn1();
    await fn2();
    await fnExcluded();
    const values1 = await globalCache.getStaleList(prefix);

    await globalCache.clearTestRun();
    await new Promise((r) => setTimeout(r, ttl + 10)); // wait for value to expire

    await fn1();
    fnExcluded();
    const values2 = await globalCache.getStaleList(prefix);

    expect(values1).toEqual([undefined, undefined]); // no stale values in the first run, because they are persistent
    expect(values2).toEqual([1]); // no '2' because it was not used in this run
  });
});

describe('ignoreTTL: true', () => {
  beforeAll(() => {
    globalCache.config({ ignoreTTL: true });
  });

  afterAll(() => {
    globalCache.config({ ignoreTTL: false });
  });

  test('value with ttl is not persistent', async () => {
    const key = 'ignore-ttl-key';
    let callCount = 0;
    const fn = () => globalCache.get(key, { ttl: 1000 }, () => ++callCount);
    const value1 = await fn();
    const value2 = await globalCache.getStale(key); // returns current value because it is not persistent
    await globalCache.clearTestRun();
    const value3 = await fn(); // increments callCount as ttl is ignored

    expect(value1).toEqual(1);
    expect(value2).toEqual(1);
    expect(value3).toEqual(2);
  });
});

describe('Signature mismatch', () => {
  const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const expectConsoleWarn = (str: string) => {
    expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining(str));
  };

  beforeEach(() => {
    consoleWarn.mockClear();
  });

  test('different locations', async () => {
    const key = `invalid-signature-different-locations`;
    const fn = () => 1;
    await globalCache.get(key, fn);
    await globalCache.get(key, fn);
    expectConsoleWarn('Signature mismatch (stack)');
  });

  test('different ttl', async () => {
    const key = `invalid-signature-different-ttl`;
    let ttl = 50;
    const fn = () => globalCache.get(key, { ttl }, () => 1);
    await fn();
    ttl = 100;
    await fn();
    expectConsoleWarn('Signature mismatch (ttl)');
    expectConsoleWarn('1-st call ttl: 50');
    expectConsoleWarn('2-nd call ttl: 100');
  });

  test('different functions', async () => {
    const key = `invalid-signature-different-fn`;
    let flag = true;
    const computeFn1 = () => 1;
    const computeFn2 = () => 2;
    const fn = () => globalCache.get(key, flag ? computeFn1 : computeFn2);
    await fn();
    flag = false;
    await fn();
    expectConsoleWarn('Signature mismatch (fn)');
    expectConsoleWarn('1-st call fn: () => 1');
    expectConsoleWarn('2-nd call fn: () => 2');
  });
});

async function waitForExpire(ttl: number) {
  await new Promise((r) => setTimeout(r, ttl + 10));
}

function clearDir(pathToDir: string) {
  if (fs.existsSync(pathToDir)) fs.rmSync(pathToDir, { recursive: true });
}
