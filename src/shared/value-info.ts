/**
 * Value info in the scope of particular test run.
 */

export type TestRunValueInfo = {
  key: string;
  sig: string;
  state: 'computing' | 'computed' | 'error';
  computedAt?: number;
  value?: unknown;
  persistent?: boolean; // indicates if the value is stored persistently (e.g., in file system)
  prevValue?: unknown; // previous value (applicable for persistent keys, used for cleanup)
  errorMessage?: string; // error message in case of 'error' states
};

export function updateValueInfo(valueInfo: TestRunValueInfo, props: Partial<TestRunValueInfo>) {
  return Object.assign(valueInfo, props);
}

export function setComputed(valueInfo: TestRunValueInfo, value: unknown) {
  updateValueInfo(valueInfo, {
    state: 'computed',
    value,
    computedAt: Date.now(),
    errorMessage: undefined,
  });
}

export function setError(valueInfo: TestRunValueInfo, errorMessage: string) {
  updateValueInfo(valueInfo, {
    state: 'error',
    errorMessage,
    value: undefined,
    computedAt: undefined,
  });
}

export function getStaleValue(valueInfo?: TestRunValueInfo | null) {
  return valueInfo?.persistent ? valueInfo.prevValue : valueInfo?.value;
}
