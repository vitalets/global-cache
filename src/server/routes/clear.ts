import { Router } from 'express';
import { clearMemoryStore } from '../storage/memory';

export const router = Router();

/**
 * Clear all memory values for a given namespace and runId.
 */
router.delete('/:namespace/:runId', async (req, res) => {
  const { namespace, runId } = req.params;
  clearMemoryStore(namespace, runId);
  res.json({ success: true });
});
