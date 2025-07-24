import { Express, Router } from 'express';
import { getConfig } from '../config';
import { listeners } from '../listeners';
import { storage } from '../storage';
import { setError, setValue } from '../value-info';
import { parseTTL } from '../ttl';

export const router = Router();

export type SetValueParams = {
  key: string;
  /* The value to set. */
  value?: unknown;
  /* An error occured during value computing. */
  error?: string;
  /* Time to live for the value, if set, value is stored on the filesystem. */
  ttl?: string | number;
};

router.post('/set', async (req, res) => {
  const { key, value, error, ttl: ttlParam } = req.body as SetValueParams;
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

  // Important to return value, as it will handle undefined values
  // in the same way as for other listeners.
  res.json(value);
});
