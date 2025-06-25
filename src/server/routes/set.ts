import { Router } from 'express';
import { getMemoryStore, MemoryStore } from '../storage/memory';
import { getFileSystemStore } from '../storage/fs';

export const router = Router();

export type SetValueReqBody = {
  persist?: boolean;
  value?: unknown;
  error?: string;
};

router.post('/:namespace/:runId/:key', async (req, res) => {
  try {
    const { namespace, runId, key } = req.params;
    const params: SetValueReqBody = req.body;

    new Setter(key, namespace, runId).setValue(params);

    res.json({ success: true });
  } catch (error) {
    const message = (error as Error)?.message || String(error);
    res.status(500).send(message);
  }
});

class Setter {
  private memoryStore: MemoryStore;

  constructor(
    private namespace: string,
    runId: string,
    private key: string,
  ) {
    this.memoryStore = getMemoryStore(namespace, runId);
  }

  setValue({ persist, value, error }: SetValueReqBody) {
    this.setMemoryValue(value, error);
    if (persist) {
      this.setPersistentValue(value, error);
    }
  }

  private setMemoryValue(value: unknown, error?: string) {
    if (error) {
      this.memoryStore.setError(this.key, error);
    } else {
      this.memoryStore.setValue(this.key, value);
    }
  }

  private setPersistentValue(value: unknown, error?: string) {
    const filesystemStore = getFileSystemStore(this.namespace);
    if (error) {
      filesystemStore.delete(this.key);
    } else {
      filesystemStore.save(this.key, value);
    }
  }
}
