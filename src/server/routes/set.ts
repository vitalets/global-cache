import { Express, Router } from 'express';
import { getConfig } from '../config';
import { listeners } from '../listeners';
import { storage } from '../storage';
import { setError, setValue } from '../value-info';
import { parseTTL } from '../ttl';

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
});
