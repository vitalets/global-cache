import { Router } from 'express';
import { getMemoryStore } from '../storage/memory';
import { getFileSystemStore } from '../storage/fs';
import { QueryParams } from '../../utils';
import { isExpired, TTL } from '../ttl';

const router = Router();
export default router;

export type GetValueParams = {
  namespace?: string;
  runId: string;
  compute?: boolean;
  ttl?: TTL;
};

router.get('/get/:key', async (req, res) => {
  try {
    const key = req.params.key;
    const {
      namespace,
      runId,
      compute: computeStr,
      ttl: ttlStr,
    } = req.query as QueryParams<GetValueParams>;
    if (!runId) throw new Error('Missing runId in query parameters');

    const { missing, value } = await getValue(key, {
      namespace,
      runId,
      compute: Boolean(computeStr),
      ttl: ttlStr as TTL,
    });

    if (missing) {
      res.status(404).end();
    } else {
      res.json(value);
    }
  } catch (error) {
    const message = (error as Error)?.message || String(error);
    res.status(500).send(message);
  }
});

// eslint-disable-next-line visual/complexity, max-statements
async function getValue(key: string, { namespace, runId, compute, ttl }: GetValueParams) {
  const memoryStore = getMemoryStore(namespace, runId);

  let valueInfo = memoryStore.get(key);

  if (ttl) {
    const fileSystemStore = getFileSystemStore(namespace);

    if (valueInfo && isExpired(valueInfo.computedAt, ttl)) {
      memoryStore.delete(key);
      valueInfo = undefined;
    }

    if (!valueInfo) {
      valueInfo = await fileSystemStore.load(key, ttl);
      // store valuein emory as well for faster access during this test run
      if (valueInfo) memoryStore.set(key, valueInfo); // eslint-disable-line max-depth
    }
  }

  if (!valueInfo) {
    if (compute) memoryStore.setValue(key, { key, pending: true });
    return { missing: true };
  }

  if (valueInfo.pending) {
    // todo: timeout
    const value = await new Promise((resolve, reject) => {
      valueInfo.listeners = valueInfo.listeners || [];
      valueInfo.listeners.push({ resolve, reject });
      memoryStore.setValue(key, valueInfo);
    });
    return { value };
  }

  return { value: valueInfo.value };
}
