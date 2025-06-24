import { Router } from 'express';
import { getMemoryStore } from '../storage/memory';
import { getFileSystemStore } from '../storage/fs';

const router = Router();
export default router;

export type SetValueParams = {
  namespace?: string;
  runId: string;
  persist?: boolean;
  value?: unknown;
  error?: string;
};

router.post('/set/:key', async (req, res) => {
  try {
    const key = req.params.key;
    const { namespace, runId, persist, value, error } = req.body as SetValueParams;
    if (!runId) throw new Error('Missing runId in query parameters');

    // todo: handle error!

    setValue(key, {
      namespace,
      runId,
      persist: Boolean(persist),
      value,
      error,
    });

    res.json({ success: true });
  } catch (error) {
    const message = (error as Error)?.message || String(error);
    res.status(500).send(message);
  }
});

function setValue(key: string, { namespace, runId, persist, value, error }: SetValueParams) {
  const memoryStore = getMemoryStore(namespace, runId);

  if (error) {
    memoryStore.setError(key, error);
  } else {
    memoryStore.set(key, value);
  }

  if (persist) {
    const filesystemStore = getFileSystemStore(namespace);
    if (error) {
      filesystemStore.delete(key);
    } else {
      filesystemStore.save(key, value);
    }
  }
}
