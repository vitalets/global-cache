import { Express, Router } from 'express';
import { parseTTL } from '../../shared/ttl';
import { getConfig } from '../config';
import { getStorage } from '../storage';

export const router = Router();

export type GetValueParams = {
  key: string;
  sig: string;
  ttl?: string;
};

/**
 * Route for geting a value.
 */
router.get('/run/:runId/get', async (req, res) => {
  const { runId } = req.params;
  const { key, sig, ttl: ttlParam } = req.query as GetValueParams;
  const config = getConfig(req.app as Express);
  const ttl = parseTTL(ttlParam);

  const storage = getStorage(config, runId);
  let valueInfo = await storage.loadInfo({ key, sig, ttl });

  if (valueInfo.state === 'computed') {
    res.json(valueInfo);
  } else if (valueInfo.state === 'computing') {
    valueInfo = await storage.waitValue(key);
    res.json(valueInfo);
  } else {
    await storage.setComputing(valueInfo);
    res.status(404).json(valueInfo);
  }
});
