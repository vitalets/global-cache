import { Express, Router } from 'express';
import { parseTTL } from '../ttl';
import { getConfig } from '../config';
import { getStorage } from '../storage';

export const router = Router();

export type GetValueParams = {
  key: string;
  ttl?: string; // Time to live for the value, if set - value is persistent.
};

/**
 * Route for geting a value.
 */
router.get('/get', async (req, res) => {
  const { key, ttl: ttlParam } = req.query as GetValueParams;
  const config = getConfig(req.app as Express);
  const ttl = parseTTL(ttlParam);

  const storage = getStorage(config);
  const valueInfo = await storage.loadInfo({ key, ttl });

  if (valueInfo.state === 'missing') {
    await storage.setComputing(valueInfo);
    res.status(404).json(valueInfo); // sending valueInfo is useful for debug
  } else {
    const value = valueInfo.state === 'computing' ? await storage.waitValue(key) : valueInfo.value;
    res.json(value);
  }
});
