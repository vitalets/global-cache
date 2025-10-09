import { Express, Router } from 'express';
import { parseTTL } from '../../shared/ttl';
import { getConfig } from '../config';
import { Getter, GetterResult } from '../getter';
import { getStorage } from '../storage';

export const router = Router();

export type GetValueParams = {
  key: string;
  sig: string;
  ttl?: string;
};

export type GetValueResponse = GetterResult;

/**
 * Route for geting a value.
 */
router.get('/run/:runId/get', async (req, res) => {
  const { runId } = req.params;
  const { key, sig, ttl: ttlParam } = req.query as GetValueParams;
  const config = getConfig(req.app as Express);
  const ttl = parseTTL(ttlParam);

  const { testRunStorage, persistentStorage } = getStorage(config, runId);
  const getter = new Getter(testRunStorage, persistentStorage);
  const data = await getter.get(key, sig, ttl);

  res.json(data);
});
