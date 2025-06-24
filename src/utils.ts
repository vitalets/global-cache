import Debug from 'debug';

export const debug = Debug('global-storage');

export type QueryParams<T> = {
  [K in keyof T]?: string;
};
