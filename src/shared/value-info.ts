/**
 * Value info in the scope of particular test run.
 */

export type TestRunValueInfo = {
  key: string;
  sig: string;
  state: 'missing' | 'expired' | 'sig-changed' | 'computing' | 'computed';
  computedAt?: number;
  value?: unknown;
  persistent?: boolean; // indicates if the value is stored persistently (e.g., in file system)
  prevValue?: unknown; // previous value (applicable for persistent keys, used for cleanup)
};

export function initValueInfo(key: string, sig: string, ttl?: number): TestRunValueInfo {
  return { key, state: 'missing', sig, persistent: Boolean(ttl) };
}

export function updateValueInfo(valueInfo: TestRunValueInfo, props: Partial<TestRunValueInfo>) {
  return Object.assign(valueInfo, props);
}

export function getStaleValue(valueInfo?: TestRunValueInfo | null) {
  return valueInfo?.persistent ? valueInfo.prevValue : valueInfo?.value;
}
