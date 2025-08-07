import Debug from 'debug';

export const debug = Debug('parallel-storage');
export const debugKey = (key: string, message: string) => {
  const debug = Debug(`parallel-storage:${key}`);
  debug(message);
};
