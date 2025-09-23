import { Express, Router } from 'express';
import { getConfig } from '../config';
import { getStorage } from '../storage';

export const router = Router();

export type SetValueParams = {
  key: string;
  value?: unknown; // The value to set.
  error?: string; // An error occured during value computing.
};

router.post('/run/:runId/set', async (req, res) => {
  const { runId } = req.params;
  const { key, value, error } = req.body as SetValueParams;
  const config = getConfig(req.app as Express);

  const storage = getStorage(config, runId);
  const valueInfo = await storage.setComputed({ key, value, error });

  res.json(valueInfo);
});
