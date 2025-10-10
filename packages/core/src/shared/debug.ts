import Debug from 'debug';

export const debug = Debug('global-cache');
export const debugKey = (key: string, message: string) => {
  const debug = Debug(`global-cache:${key}`);
  debug(message);
};
