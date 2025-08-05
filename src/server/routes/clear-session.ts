import { Express, Router } from 'express';
import { getConfig } from '../config';
import { getStorage } from '../storage';

export const router = Router();

router.post('/clear-session', async (req, res) => {
  const config = getConfig(req.app as Express);

  const storage = getStorage(config);
  await storage.clearSession();

  res.end();
});
