import { expect, test } from '@playwright/test';
import { globalCache } from '../src';

let callCount = 0;
let userId = '';

test.beforeEach(async () => {
  userId = await globalCache.get('user-id', async () => {
    callCount++;
    return 'foo';
  });
});

test('test 1', async () => {
  expect(callCount).toBe(1);
  expect(userId).toBe('foo');
});

test('test 2', async () => {
  expect(callCount).toBe(1);
  expect(userId).toBe('foo');
});
