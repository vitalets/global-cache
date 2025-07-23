import { Express, Router } from 'express';
import { getConfig } from '../config';
import { storage } from '../storage';

export const router = Router();

/**
 * Route for geting a stale value.
 */
router.get('/:key/stale', async (req, res) => {
  const { key } = req.params;
  const { basePath } = getConfig(req.app as Express);
  // ttl: 0 -> load only from memory
  const valueInfo = await storage.load({ basePath, key, ttl: 0 });
  const staleValue = valueInfo.persistent ? valueInfo.oldValue : valueInfo.value;
  res.json(staleValue);
});
