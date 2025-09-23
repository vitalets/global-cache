import { Express, Router } from 'express';
import { getConfig } from '../config';
import { getStorage } from '../storage';

export const router = Router();

export type GetStaleListParams = {
  prefix: string;
};

router.get('/run/:runId/get-stale-list', async (req, res) => {
  const { runId } = req.params;
  const { prefix } = req.query as GetStaleListParams;
  const config = getConfig(req.app as Express);

  const storage = getStorage(config, runId);
  const valueInfoList = await storage.getLoadedInfoList(prefix);

  res.json(valueInfoList);
});
