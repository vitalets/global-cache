import Debug from 'debug';

export const debug = Debug('global-storage');
export const debugKey = (key: string, message: string) => {
  const debug = Debug(`global-storage:${key}`);
  debug(message);
};
// export const debugForKey = (key: string) => Debug(`global-storage:${key}`);
