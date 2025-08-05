import { Router } from 'express';
import { storage } from '../single-instance';

export const router = Router();

export type GetStaleListParams = {
  prefix: string;
};

router.get('/get-stale-list', async (req, res) => {
  const { prefix } = req.query as GetStaleListParams;
  const values = [...storage.getData().values()]
    .filter((valueInfo) => valueInfo.key.startsWith(prefix))
    .map((valueInfo) => (valueInfo.persistent ? valueInfo.oldValue : valueInfo.value));

  res.json(values);
});
