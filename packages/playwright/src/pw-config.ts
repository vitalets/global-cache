/**
 * Simplified Playwright config.
 * See: https://github.com/microsoft/playwright/blob/main/packages/playwright/types/test.d.ts
 */
export type PlaywrightLikeConfig = {
  globalSetup?: string | string[];
  globalTeardown?: string | string[];
  reporter?: string | unknown[];
};

export function addGlobalHook(origValue: string | string[] | undefined, hook: string) {
  const arr = Array.isArray(origValue) ? [...origValue] : origValue ? [origValue] : [];
  if (!arr.includes(hook)) arr.push(hook);
  return arr;
}

export function addReporter(origValue: string | unknown[] | undefined, reporter: string) {
  const arr = Array.isArray(origValue) ? [...origValue] : origValue ? [[origValue]] : [];
  const exists = arr.some((item) => (item as [string])[0] === reporter);
  if (!exists) arr.push([reporter]);
  return arr;
}
