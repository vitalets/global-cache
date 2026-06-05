import { Express, Router } from 'express';
import { getConfig } from '../config';
import { getStorage } from '../storage';

export const router: ReturnType<typeof Router> = Router();

export type DeleteValueParams = {
  key: string;
};

router.post('/run/:runId/delete', async (req, res) => {
  const { runId } = req.params;
  const { key } = req.body as DeleteValueParams;
  const config = getConfig(req.app as Express);

  const { testRunStorage, persistentStorage } = getStorage(config, runId);

  const valueInfo = await testRunStorage.load(key);
  await testRunStorage.delete(key);
  if (valueInfo?.persistent) await persistentStorage.delete(key);

  res.end();
});
