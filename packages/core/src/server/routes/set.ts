import { Express, Router } from 'express';
import { getConfig } from '../config';
import { TestRunValueInfo } from '../../shared/value-info';
import { Setter } from '../setter';
import { getStorage } from '../storage';

export const router: ReturnType<typeof Router> = Router();

export type SetValueParams = {
  key: string;
  value?: unknown; // The value to set.
  error?: string; // An error occured during value computing.
};

export type SetValueResponse = TestRunValueInfo;

router.post('/run/:runId/set', async (req, res) => {
  const { runId } = req.params;
  const { key, value, error } = req.body as SetValueParams;
  const config = getConfig(req.app as Express);

  const { testRunStorage, persistentStorage } = getStorage(config, runId);
  const setter = new Setter(testRunStorage, persistentStorage);
  const valueInfo = await setter.set({ key, value, error });

  res.json(valueInfo);
});
