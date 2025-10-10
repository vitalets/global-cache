import { Express, Router } from 'express';
import { getConfig } from '../config';
import { getStorage } from '../storage';

export const router = Router();

router.post('/run/:runId/clear', async (req, res) => {
  const { runId } = req.params;
  const config = getConfig(req.app as Express);

  const { testRunStorage } = getStorage(config, runId);
  await testRunStorage.clear();

  res.end();
});
