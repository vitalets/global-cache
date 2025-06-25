import { Router } from 'express';
import { getMemoryStore } from '../storage/memory';
import { getFileSystemStore } from '../storage/fs';

const router = Router();
export default router;

export type SetValueParams = {
  persist?: boolean;
  value?: unknown;
  error?: string;
};

router.post('/:namespace/:runId/:key', async (req, res) => {
  try {
    const { namespace, runId, key } = req.params;
    const params: SetValueParams = req.body;
    new Setter(key, namespace, runId, params).setValue();
    res.json({ success: true });
  } catch (error) {
    const message = (error as Error)?.message || String(error);
    res.status(500).send(message);
  }
});

class Setter {
  // eslint-disable-next-line max-params
  constructor(
    private key: string,
    private namespace: string,
    private runId: string,
    private params: SetValueParams,
  ) {}

  setValue() {
    this.setMemoryValue();
    if (this.params.persist) {
      this.setPersistentValue();
    }
  }

  private setMemoryValue() {
    const { value, error } = this.params;
    const memoryStore = getMemoryStore(this.namespace, this.runId);

    if (error) {
      memoryStore.setError(this.key, error);
    } else {
      memoryStore.setValue(this.key, value);
    }
  }

  private setPersistentValue() {
    const { value, error } = this.params;
    const filesystemStore = getFileSystemStore(this.namespace);

    if (error) {
      filesystemStore.delete(this.key);
    } else {
      filesystemStore.save(this.key, value);
    }
  }
}
