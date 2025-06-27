import { Router } from 'express';
import { clearMemoryStore } from '../storage/memory';

export const router = Router();

export type GetValueQuery = {
  compute?: string;
  ttl?: string;
};

router.delete('/:namespace/:runId', async (req, res) => {
  const { namespace, runId } = req.params;
  clearMemoryStore(namespace, runId);
  res.json({ success: true });
});
