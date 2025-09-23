import { Express, Router } from 'express';
import { getConfig } from '../config';
import { getStorage } from '../storage';

export const router = Router();

router.post('/run/:runId/clear-session', async (req, res) => {
  const { runId } = req.params;
  const config = getConfig(req.app as Express);

  const storage = getStorage(config, runId);
  await storage.clearSession();

  res.end();
});
