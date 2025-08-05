import { Express, Router } from 'express';
import { getConfig } from '../config';
import { parseTTL } from '../ttl';
import { getStorage } from '../storage';

export const router = Router();

export type SetValueParams = {
  key: string;
  value?: unknown; // The value to set.
  error?: string; // An error occured during value computing.
  ttl?: string | number; // Time to live for the value, if set - value is persistent.
};

router.post('/set', async (req, res) => {
  const { key, value, error, ttl: ttlParam } = req.body as SetValueParams;
  const config = getConfig(req.app as Express);
  const ttl = parseTTL(ttlParam);

  const storage = getStorage(config);
  await storage.setValue({ key, ttl, value, error });

  // Important to return value to handle undefined in the same way as for other listeners.
  res.json(value);
});
