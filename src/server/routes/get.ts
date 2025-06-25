import { Router } from 'express';
import { getMemoryStore, MemoryStore, ValueInfo } from '../storage/memory';
import { getFileSystemStore } from '../storage/fs';
import { isExpired, TTL } from '../ttl';

export const router = Router();

export type GetValueQuery = {
  compute?: string;
  ttl?: string;
};

router.get('/:namespace/:runId/:key', async (req, res) => {
  try {
    const { namespace, runId, key } = req.params;
    const query: GetValueQuery = req.query;

    const getter = new Getter(namespace, runId, key);
    await getter.loadValue({
      ttl: query.ttl as TTL,
      compute: Boolean(query.compute),
    });

    if (getter.isMissing) {
      res.status(404).end();
    } else {
      res.json(getter.value);
    }
  } catch (error) {
    const message = (error as Error)?.message || String(error);
    res.status(500).send(message);
  }
});

class Getter {
  isMissing?: boolean;
  value?: unknown;
  private memoryStore: MemoryStore;
  private valueInfo?: ValueInfo;

  constructor(
    private namespace: string,
    runId: string,
    private key: string,
  ) {
    this.memoryStore = getMemoryStore(namespace, runId);
  }

  // eslint-disable-next-line visual/complexity
  async loadValue({ ttl, compute }: { ttl?: TTL; compute: boolean }) {
    this.loadFromMemory();

    if (ttl) {
      this.clearIfExpired(ttl);
    }

    if (ttl && !this.valueInfo) {
      await this.loadFromFileSystem(ttl);
    }

    if (!this.valueInfo) {
      this.handleMissing(compute);
    } else if (this.valueInfo.pending) {
      await this.waitForCompute();
    } else {
      this.value = this.valueInfo.value;
    }
  }

  private loadFromMemory() {
    this.valueInfo = this.memoryStore.get(this.key);
  }

  private async loadFromFileSystem(ttl: TTL) {
    const fileSystemStore = getFileSystemStore(this.namespace);
    this.valueInfo = await fileSystemStore.load(this.key, ttl);
    // store value in memory as well for faster access
    if (this.valueInfo) this.memoryStore.set(this.key, this.valueInfo);
  }

  private clearIfExpired(ttl: TTL) {
    if (this.valueInfo && isExpired(this.valueInfo.computedAt, ttl)) {
      this.memoryStore.delete(this.key);
      this.valueInfo = undefined;
    }
  }

  private handleMissing(compute: boolean) {
    if (compute) {
      this.memoryStore.setValue(this.key, { key: this.key, pending: true });
    }
    this.isMissing = true;
  }

  private async waitForCompute() {
    const valueInfo = this.valueInfo!;
    this.value = await new Promise((resolve, reject) => {
      valueInfo.listeners = valueInfo.listeners || [];
      valueInfo.listeners.push({ resolve, reject });
      this.memoryStore.setValue(this.key, valueInfo);
    });
  }
}
