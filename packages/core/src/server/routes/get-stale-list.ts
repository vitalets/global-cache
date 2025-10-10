import { Express, Router } from 'express';
import { getConfig } from '../config';
import { getStorage } from '../storage';
import { TestRunValueInfo } from '../../shared/value-info';

export const router = Router();

export type GetStaleListParams = {
  prefix: string;
};

export type SetStaleListResponse = TestRunValueInfo[];

/**
 * Returns a list of stale values by prefix.
 * For stale we return only values used in this test-run.
 */
router.get('/run/:runId/get-stale-list', async (req, res) => {
  const { runId } = req.params;
  const { prefix } = req.query as GetStaleListParams;
  const config = getConfig(req.app as Express);

  const { testRunStorage } = getStorage(config, runId);
  const valueInfoList = await testRunStorage.loadByPrefix(prefix);

  res.json(valueInfoList);
});
