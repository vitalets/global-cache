import { debug } from '../utils';

export type ValueInfo = {
  key: string;
  value?: unknown;
  state: 'missing' | 'computing' | 'computed';
  persistent?: boolean; // indicates if the value is stored persistently (e.g., in file system)
  oldValue?: unknown; // previous value (applicable for persistent keys, used for cleanup)
  computedAt?: number; // timestamp when the value was computed (applicable for persistent keys)
};

export function initValueInfo(key: string): ValueInfo {
  return { key, state: 'missing' };
}

export function isExpired({ state, computedAt }: ValueInfo, ttl: number) {
  if (state === 'computed') {
    if (!computedAt || ttl === -1) return false;
    return Date.now() > computedAt + ttl;
  }
}

export function setMissing(info: ValueInfo) {
  if (info.state === 'missing') return;
  info.state = 'missing';
  info.oldValue = info.value;
  info.value = undefined;
  info.computedAt = undefined;
}

export function setValue(info: ValueInfo, value: unknown) {
  if (info.state !== 'computing') {
    debug(`Setting value for key "${info.key}" that is not in "computing" state.`);
  }
  info.state = 'computed';
  info.value = value;
  info.computedAt = Date.now();
}

export function setError(info: ValueInfo) {
  if (info.state !== 'computing') {
    debug(`Setting error for key "${info.key}" that is not in "computing" state.`);
  }
  info.state = 'missing';
  info.value = undefined;
  info.computedAt = undefined;
}
