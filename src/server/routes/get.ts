import { Express, Router } from 'express';
import { parseTTL } from '../ttl';
import { getConfig } from '../config';
import { listeners } from '../single-instance/listeners';
import { storage } from '../single-instance';

export const router = Router();

export type GetValueParams = {
  key: string;
  /* Time to live for the value, if set, value is persisted on the filesystem. */
  ttl?: string;
};

/**
 * Route for geting a value.
 */

router.get('/get', async (req, res) => {
  const { key, ttl: ttlParam } = req.query as GetValueParams;
  const { basePath } = getConfig(req.app as Express);
  const ttl = parseTTL(ttlParam);
  const valueInfo = await storage.load({ basePath, key, ttl });

  if (valueInfo.state === 'missing') {
    valueInfo.state = 'computing';
    // Pass ttl: 0 to avoid saving to fs
    // todo: improve this place
    await storage.save({ basePath, valueInfo, ttl: 0 });
    res.status(404).json(valueInfo);
  } else {
    const value = valueInfo.state === 'computing' ? await listeners.wait(key) : valueInfo.value;
    res.json(value);
  }
});
