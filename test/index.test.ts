import fs from 'node:fs';
import { beforeAll, afterAll, test, expect } from 'vitest';
import { globalStorage } from '..';

const basePath = './test/.global-storage';
const values = [42, 'hello', true, { foo: 'bar' }, [1, 2, 3], null, undefined];

beforeAll(async () => {
  if (fs.existsSync(basePath)) {
    fs.rmSync(basePath, { recursive: true });
  }

  globalStorage.defineConfig({ basePath });

  const { default: globalSetup } = await import(globalStorage.setup);
  await globalSetup();
});

afterAll(async () => {
  const { default: globalTeardown } = await import(globalStorage.teardown);
  await globalTeardown();
});

test('store and fetch different value types (memory)', async () => {
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

test('store and fetch different value types (filesystem)', async () => {
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
    await new Promise((r) => setTimeout(r, ttl + 10)); // wait for value to expire
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

test('error while computing value', async () => {
  const fn = () =>
    globalStorage.getOrCall(`error-key`, async () => {
      throw new Error('foo');
    });

  await Promise.all([
    expect(fn()).rejects.toThrow('foo'), // prettier-ignore
    expect(fn()).rejects.toThrow('foo'),
  ]);
});
