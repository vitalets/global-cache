import { TTL } from '../shared/ttl';

// Key-value types for strictly typed storage.
export type DefaultSchema = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
export type Keys<S extends DefaultSchema> = keyof S & string; // strip number | symbol;

export type ComputeFn<Res> = () => Res | Promise<Res>;
export type KeyParams = { ttl?: TTL };
export type GetArgs<K extends Keys<S>, S extends DefaultSchema> =
  | [K, ComputeFn<S[K]>]
  | [K, KeyParams, ComputeFn<S[K]>];
