import { Express, Router } from 'express';
import { getConfig } from '../config';
import { getStorage } from '../storage';

export const router = Router();

export type GetStaleParams = {
  key: string;
};

/**
 * Route for geting a stale value.
 */
router.get('/get-stale', async (req, res) => {
  const { key } = req.query as GetStaleParams;
  const config = getConfig(req.app as Express);

  // for stale we return only values used in this test-run.
  const storage = getStorage(config);
  const valueInfo = await storage.getLoadedInfo(key);

  res.json(valueInfo ?? null);
});
