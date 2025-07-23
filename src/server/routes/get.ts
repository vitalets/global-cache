import { Express, Router } from 'express';
import { parseTTL } from '../ttl';
import { getConfig } from '../config';
import { listeners } from '../listeners';
import { storage } from '../storage';

export const router = Router();

export type GetValueQuery = {
  /* Value will be computed on the client (if not exist) */
  compute?: string;
  /* Time to live for the value, if set, value is stored on the filesystem. */
  ttl?: string;
};

/**
 * Route for geting a value.
 */

router.get('/:key', async (req, res) => {
  const { key } = req.params;
  const { ttl: ttlParam, compute }: GetValueQuery = req.query;
  const { basePath } = getConfig(req.app as Express);
  const ttl = parseTTL(ttlParam);

  const valueInfo = await storage.load({ basePath, key, ttl });

  if (valueInfo.state === 'missing') {
    if (compute) {
      valueInfo.state = 'computing';
      // Pass ttl: 0 to avoid saving to fs
      // todo: improve this place
      await storage.save({ basePath, valueInfo, ttl: 0 });
    }
    res.status(404).json(valueInfo);
  } else {
    const value = valueInfo.state === 'computing' ? await listeners.wait(key) : valueInfo.value;
    res.json(value);
  }
});
