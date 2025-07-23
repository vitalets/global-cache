import { Express, Router } from 'express';
import { getConfig } from '../config';
import { listeners } from '../listeners';
import { storage } from '../storage';
import { setError, setValue } from '../value-info';
import { parseTTL } from '../ttl';

/* eslint-disable max-statements */

export const router = Router();

export type SetValueReqBody = {
  /* The value to set. */
  value?: unknown;
  /* An error occured during value computing. */
  error?: string;
  /* Time to live for the value, if set, value is stored on the filesystem. */
  ttl?: string | number;
};

/**
 * Route for setting a value.
 */
router.post('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, error, ttl: ttlParam }: SetValueReqBody = req.body;
    const { basePath } = getConfig(req.app as Express);
    const ttl = parseTTL(ttlParam);

    const valueInfo = await storage.load({ basePath, key, ttl });

    if (error) {
      setError(valueInfo);
      listeners.notifyError(key, error);
    } else {
      setValue(valueInfo, value);
      listeners.notifyValue(key, value);
    }

    await storage.save({ basePath, valueInfo, ttl });
    res.json(valueInfo);
  } catch (error) {
    const message = (error as Error)?.message || String(error);
    res.status(500).send(message);
  }
});

/*
class Setter {
  private memoryStore: MemoryStorage;

  // eslint-disable-next-line max-params
  constructor(
    private namespace: string,
    runId: string,
    private key: string,
    private basePath: string,
  ) {
    this.memoryStore = getMemoryStore(namespace, runId);
  }

  setValue({ persist, value, error }: SetValueReqBody) {
    this.setMemoryValue(value, error);
    if (persist) {
      this.setPersistentValue(value, error);
    }
  }

  private setMemoryValue(value: unknown, error?: string) {
    if (error) {
      this.memoryStore.setError(this.key, error);
    } else {
      this.memoryStore.setValue(this.key, value);
    }
  }

  private setPersistentValue(value: unknown, error?: string) {
    const filesystemStore = getFileSystemStore(this.basePath, this.namespace);
    if (error) {
      filesystemStore.delete(this.key);
    } else {
      filesystemStore.save(this.key, value);
    }
  }
}
*/
