const isPlaywrightWorker = Boolean(process.env.WORKER_INDEX);

export function ensureWorker(prefix = 'This code') {
  if (!isPlaywrightWorker) {
    throw new Error(`${prefix} should be used only in Playwright worker.`);
  }
}

export function ensureConfig(prefix = 'This code') {
  if (isPlaywrightWorker) {
    throw new Error(`${prefix} should be used only in Playwright config.`);
  }
}
