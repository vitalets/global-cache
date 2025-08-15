import { Express, Router } from 'express';
import { getConfig } from '../config';
import { getStorage } from '../storage';

export const router = Router();

export type GetStaleListParams = {
  prefix: string;
};

router.get('/get-stale-list', async (req, res) => {
  const { prefix } = req.query as GetStaleListParams;
  const config = getConfig(req.app as Express);

  const storage = getStorage(config);
  const valueInfoList = await storage.getLoadedInfoList(prefix);

  res.json(valueInfoList);
});
