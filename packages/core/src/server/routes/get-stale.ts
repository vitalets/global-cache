import { Express, Router } from 'express';
import { getConfig } from '../config';
import { getStorage } from '../storage';
import { TestRunValueInfo } from '../../shared/value-info';

export const router: ReturnType<typeof Router> = Router();

export type GetStaleParams = {
  key: string;
};

export type SetStaleResponse = TestRunValueInfo | null;

/**
 * Returns a stale value.
 * For stale we return only values used in this test-run.
 */
router.get('/run/:runId/get-stale', async (req, res) => {
  const { runId } = req.params;
  const { key } = req.query as GetStaleParams;
  const config = getConfig(req.app as Express);

  const { testRunStorage } = getStorage(config, runId);
  const valueInfo = await testRunStorage.load(key);

  res.json(valueInfo ?? null);
});
