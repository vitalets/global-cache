/**
 * Info about value and helper functions to manage it.
 */

export type ValueInfo = {
  key: string;
  sig: string;
  state: 'missing' | 'expired' | 'sig-changed' | 'computing' | 'computed';
  value?: unknown;
  persistent?: boolean; // indicates if the value is stored persistently (e.g., in file system)
  prevValue?: unknown; // previous value (applicable for persistent keys, used for cleanup)
};

export function assignValueInfo(valueInfo: ValueInfo, props: Partial<ValueInfo>) {
  return Object.assign(valueInfo, props);
}

export function getStaleValue(valueInfo?: ValueInfo | null) {
  return valueInfo?.persistent ? valueInfo.prevValue : valueInfo?.value;
}
